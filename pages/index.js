import Head from 'next/head'
import Router from 'next/dist/next-server/lib/router/router'
import styles from '../styles/Home.module.css'
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { createGlobalStyle } from 'styled-components';

import Card from '../components/card';

export default function Home() {
  const [deckId, setDeckId] = useState('');

  const [playerHand, setPLayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [splitHand, setSplitHand] = useState([]);

  const [money, setMoney] = useState(3000);
  const [betMoney, setBetMoney] = useState(0);
  const [remainingCards, setRemainingCards] = useState(0);
  const [playing, setPLaying] = useState(false);
  const [roundOverMsg, setRoundOverMsg] = useState("");

  const [stand, setStand] = useState(false);

  const [playError, setPlayError] = useState("");

  useEffect(() => {
    let id = (deckId === '' || deckId === undefined) ? 'new' : deckId;
    fetch(`https://deckofcardsapi.com/api/deck/${id}/shuffle/?deck_count=4`)
      .then(response => {
        return response.json();
      })
      .then(data => {
        setDeckId(data.deck_id);
        setRemainingCards(data.remaining);
      })
      .catch(error => {
        HandleError(error);
      })
  }, []);

  useEffect(() => {
    const Draw = async () => {
      if (CalculateScore(dealerHand) < 17 && stand) {
        await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`)
          .then(response => {
            return response.json();
          })
          .then(data => {
            setDealerHand([...dealerHand, data.cards[0]]);
            setRemainingCards(data.remaining);
          })
          .catch(error => HandleError(error));
      }
      else if (stand) {
        setStand(false);
        EndRound();
      }
    }
    Draw();
  }, [dealerHand, stand]);

  useEffect(() => {
    if (CalculateScore(playerHand) > 21) EndRound();
  }, [playerHand]);

  // useEffect(() => {
    // if (playing) {
      // if (CalculateScore(playerHand === 21 && CalculateScore(dealerHand) === 21)) {
        // setRoundOverMsg("Both got blackjack! You get your bet back.");
        // setMoney(money + betMoney);
      // } else if (CalculateScore(playerHand) === 21) {
        // setRoundOverMsg("Blackjack! You get " + betMoney * 3 + "!");
        // setMoney(money + betMoney * 3);
      // } else if (CalculateScore(dealerHand) === 21) setRoundOverMsg("Dealer got blackjack! You lose.");
    // }
  // }, [playing])

  function HandleError(error) {
    console.error(error);
    setPlayError("Error: " + error);
    if (playerHand.length === 0 || dealerHand.length === 0) ToBet();
  }

  async function DealHands() {
    setPlayError("");
    console.log(playerHand.length);
    await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=2`)
      .then(response => {
        return response.json();
      })
      .then(data => {
        setPLayerHand(data.cards);
        setRemainingCards(data.remaining);
      })
      .catch(error => HandleError(error));
    await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=2`)
      .then(response => {
        return response.json();
      })
      .then(data => {
        setDealerHand(data.cards);
        setRemainingCards(data.remaining);
      })
      .catch(error => HandleError(error));
    setMoney(money - betMoney);
    setPLaying(true);
  }

  function EndRound() {
    const playerScore = CalculateScore(playerHand);
    const dealerScore = CalculateScore(dealerHand);
    if (playerScore > 21) setRoundOverMsg("Player bust! You lose.");
    else if (dealerScore > 21) {
      setRoundOverMsg("Dealer bust! You win " + betMoney * 2 + "!");
      setMoney(money + betMoney * 2);
    } else if (playerScore > dealerScore) {
      setRoundOverMsg("Player win! You win " + betMoney * 2 + "!")
      setMoney(money + betMoney * 2);
    } else if (playerScore < dealerScore) setRoundOverMsg("Dealer win! You lose.");
    else if (playerScore === dealerScore) {
      setRoundOverMsg("Push! You get your bet back.");
      setMoney(money + betMoney);
    }
  }

  function CalculateScore(hand) {
    let sum = 0;
    hand.forEach(card => {
      let n = parseInt(card.value);
      if (isNaN(n)) {
        if (card.value === "KING" || card.value === "QUEEN" || card.value === "JACK") n = 10;
        else if (card.value === "ACE") n = 11;
      }
      sum += n;
    });
    hand.forEach(card => {
      if (sum > 21 && card.value === "ACE") sum -= 10;
    })
    return sum;
  }

  async function OnStand() {
    setStand(true);
  }

  function ToBet() {
    fetch(`https://deckofcardsapi.com/api/deck/${deckId}/shuffle/`);
    setPLayerHand([]);
    setDealerHand([]);
    setRoundOverMsg("");
    setPLaying(false);
  }

  async function Hit() {
    setPlayError("");
    await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`)
      .then(response => {
        return response.json();
      })
      .then(data => {
        setPLayerHand([...playerHand, data.cards[0]]);
        setRemainingCards(data.remaining);
      })
      .catch(error => HandleError(error));
  }

  return (
    <>
      <GlobalStyle />
      {(playError !== "") ? <h3 id="errorBar">{playError}</h3> : null}
      {playing ?
        <>
          <div className='topHalf'>
            <AnimatePresence className="cardCon">
              {dealerHand.map((card, index) => {
                return (<Card card={card} key={index} />);
              })}
            </AnimatePresence>
            <h2>{CalculateScore(dealerHand)}</h2>
          </div>
          <div className='bottomHalf'>
            <AnimatePresence className="cardCon">
              {playerHand.map((card, index) => {
                return (<Card card={card} key={index} />);
              })}
            </AnimatePresence>
            <h2>{CalculateScore(playerHand)}</h2>
            {roundOverMsg === "" && !stand ?
              <nav id='gameBtns'>
                <button onClick={Hit} >SPLIT</button>
                <button onClick={Hit} >HIT</button>
                <button onClick={OnStand} >STAND</button>
                <button onClick={Hit} >DOUBLE</button>
              </nav> :
              roundOverMsg !== "" ?
                <div>
                  <h1>{roundOverMsg}</h1>
                  <button onClick={ToBet} >TILBAKE</button>
                </div> : null
            }
            <h1 style={{ position: 'absolute', bottom: 10, left: 10 }}>Your bet: ${betMoney}</h1>
          </div>
        </> :

        <>
          <div className='topHalf'>
            <h1>Your bet: ${betMoney}</h1>
          </div>
          <div className='bottomHalf'>
            <div id="chips">
              <button className="chip" onClick={() => setBetMoney(betMoney + 10)}>10</button>
              <button className="chip" onClick={() => setBetMoney(betMoney + 50)}>50</button>
              <button className="chip" onClick={() => setBetMoney(betMoney + 100)}>100</button>
              <button className="chip" onClick={() => setBetMoney(betMoney + 500)}>500</button>
              <button className="chip" onClick={() => setBetMoney(betMoney + 1000)}>1000</button>
            </div>
            <button onClick={DealHands} className='playBtn' >PLAY</button>
            <h1 style={{ position: 'absolute', bottom: 10, left: 10 }}>You Have ${money}</h1>
          </div>
        </>}
      {/* <p>Remaining Cards: {remainingCards}</p> */}
    </>
  )
}

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
  }
  .topHalf {
    background: lightblue;
    width: 100vw;
    height: 50vh;
  }
  .bottomHalf {
    background: pink;
    width: 100vw;
    height: 50vh;
    padding: 10px;
  }
  .playBtn {
    position: absolute;
    bottom: 10px;
    right: 10px;
    width: 10rem;
    height: 10rem;
    border-radius: 50%;
    border-style: solid;
    font-size: 2rem;
  }
  #gameBtns {
    position: absolute;
    bottom: 10px;
    right: 10px;
  }
  #gameBtns > button {
    width: 6em;
    height: 6em;
    border-radius: 50%;
    border-style: solid;
    font-size: 1.5rem;
  }
  .cardCon {
    transform-style: preserve-3d;
  }
  #errorBar {
    width: 100vw;
    background: red;
    color: white;
    position: fixed;
    z-index: 1;
    top: 0;
    text-align: center;
  }
  #chips {
    position: relative;
    max-width: 70%;
    gap: 5px;
    display: flex;
  }
  .chip {
    width: 6em;
    height: 6em;
    border-radius: 50%;
    border-style: dashed;
    border-width: 0.5em;
    border-color: green;
    background: white;
    font-size: 1.5rem;
  }
`;

//export async function getStaticProps() {
//  const res = await fetch();
//  const post = await res.json();
//}
