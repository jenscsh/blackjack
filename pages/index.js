import Head from 'next/head'
import Router from 'next/dist/next-server/lib/router/router'
import styles from '../styles/Home.module.css'
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { createGlobalStyle } from 'styled-components';

import Card from '../components/card';

export default function Home() {
  const [deckId, setDeckId] = useState('');

  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [splitHand, setSplitHand] = useState([]);

  const [money, setMoney] = useState(3000);
  const [betMoney, setBetMoney] = useState(0);
  const [remainingCards, setRemainingCards] = useState(0);
  const [playing, setPLaying] = useState(false);
  const [roundOverMsg, setRoundOverMsg] = useState("");

  const [stand, setStand] = useState(false);
  const [hideCard, setHideCard] = useState(false);

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
        setHideCard(false);
        await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`)
          .then(response => {
            return response.json();
          })
          .then(data => {
            setDealerHand([...dealerHand, data.cards[0]]);
            setRemainingCards(data.remaining);
          })
          .catch(error => HandleError(error, true));
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

  useEffect(() => {
    CheckBlackJack();
  }, [playerHand, dealerHand]);

  useEffect(() => setPlayError(""), [betMoney]);

  function CheckBlackJack() {
    if (playerHand.length === 2 && dealerHand.length === 2) {
      if (CalculateScore(playerHand) === 21 && CalculateScore(dealerHand) === 21) {
        setRoundOverMsg("Both got blackjack! You get your bet back.");
        setMoney(money + betMoney);
        setHideCard(false);
      } else if (CalculateScore(playerHand) === 21) {
        setRoundOverMsg("Blackjack! You get " + betMoney * 3 + "!");
        setMoney(money + betMoney * 3);
        setHideCard(false);
      } else if (CalculateScore(dealerHand) === 21) {
        setHideCard(false);
        setRoundOverMsg("Dealer got blackjack! You lose.");
      }
    }
  }

  function HandleError(error, abort = false) {
    console.error(error);
    setPlayError("Error: " + error);
    if (abort) {
      setMoney(money + betMoney);
      ToBet();
    }
  }

  async function DealHands() {
    setPlayError("");
    if (betMoney === 0) {
      setPlayError("Error: Need bet to start the game");
      return;
    }
    setHideCard(true);
    await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=2`)
      .then(response => {
        return response.json();
      })
      .then(data => {
        setPlayerHand(data.cards);
        setRemainingCards(data.remaining);
        setPLaying(true);
      })
      .catch(error => HandleError(error, true));
    await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=2`)
      .then(response => {
        return response.json();
      })
      .then(data => {
        setDealerHand(data.cards);
        setRemainingCards(data.remaining);
        setPLaying(true);
      })
      .catch(error => HandleError(error, true));
    setMoney(money - betMoney);
  }

  function EndRound() {
    setHideCard(false);
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

  function ToBet() {
    fetch(`https://deckofcardsapi.com/api/deck/${deckId}/shuffle/`);
    setPlayerHand([]);
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
        setPlayerHand([...playerHand, data.cards[0]]);
        setRemainingCards(data.remaining);
      })
      .catch(error => HandleError(error));
  }

  function Double() {
    setBetMoney(betMoney * 2);
    Hit();
    setStand(true);
  }

  return (
    <>
      <GlobalStyle />
      {(playError !== "") ? <h3 id="errorBar">{playError}</h3> : null}
      {playing ?
        <>
          <div className='topHalf'>
            <h1 style={{  backgroundColor: "white", padding: 10, fontSize: '1.3em', border: "3px solid black", display: 'block', maxWidth: 200 }}>Your bet: ${betMoney}</h1>
            <div className="hand">
              <AnimatePresence>
                {dealerHand.map((card, index) => {
                  let r = index === 1 ? hideCard : false;
                  return (<Card card={card} hide={r} key={index} />);
                })}
              </AnimatePresence>
            </div>
            <h2>{roundOverMsg === "" & !stand && dealerHand.length > 0 ? CalculateScore([dealerHand[0]]) : CalculateScore(dealerHand)}</h2>
          </div>
          <div className='bottomHalf'>
            <div className="hand">
              <AnimatePresence>
                {playerHand.map((card, index) => {
                  return (<Card card={card} hide={false} key={index} />);
                })}
              </AnimatePresence>
            </div>
            <h2>{CalculateScore(playerHand)}</h2>
            {roundOverMsg === "" && !stand ?
              <nav id='gameBtns'>
                {playerHand.length === 2 && CalculateScore([playerHand[0]]) === CalculateScore([playerHand[1]]) ? <button onClick={Hit} >SPLIT</button> : null}
                {playerHand.length === 2 ? <button onClick={Double} >DOUBLE</button> : null}
                <button onClick={Hit} >HIT</button>
                <button onClick={() => setStand(true)} >STAND</button>
              </nav> :
              roundOverMsg !== "" ?
                <div id="roundOver">
                  <h1>{roundOverMsg}</h1>
                  <button onClick={ToBet} >NEW GAME</button>
                </div> : null
            }
            
          </div>
        </> :

        <>
          <div className='topHalf'>
            <h1 style={{ fontSize: '1.3em',backgroundColor: "white", padding: 10, border: "3px solid black", maxWidth: 200 }}>Your bet: ${betMoney}</h1>
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
            <h1 style={{ position: 'absolute', bottom: 10, left: 10, backgroundColor: "white", padding: 10, fontSize: '1.4em', border: "3px solid black" }}>You have: ${money}</h1>
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
    padding: 10px;
  }
  .bottomHalf {
    background: pink;
    width: 100vw;
    height: 50vh;
    padding: 10px;
  }
  .hand {
    display: flex;
    flex-wrap: wrap;
  }
  .playBtn {
    position: absolute;
    bottom: 10px;
    right: 10px;
    width: 10vw;
    height: 10vw;
    min-width: 100px;
    min-height: 100px;
    border-radius: 50%;
    border-style: solid;
    font-size: 2rem;
    box-shadow: 0 0 5px;
    background: lightgreen
  }
  #roundOver {
    position: relative;
    width: 90vw;
    font-size: 1rem;
  }
  #roundOver > button {
    font-size: 1rem;
  }
  #gameBtns {
    position: absolute;
    bottom: 10px;
    right: 10px;
    display: flex;
  }
  #gameBtns > button {
    width: 20vw;
    height: 20vw;
    min-width: 50px;
    min-height: 50px;
    max-width: 150px;
    max-height: 150px;
    border-radius: 50%;
    border-style: solid;
    font-size: 1.5rem;
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
    gap: 10px;
    display: flex;
    flex-wrap: wrap;
  }
  .chip {
    width: 20vw;
    height: 20vw;
    min-width: 50px;
    min-height: 50px;
    max-width: 150px;
    max-height: 150px;
    border-radius: 50%;
    border-style: dashed;
    border-width: 1vw;
    border-color: green;
    background: white;
    font-size: 1.5rem;
    box-shadow: 5px 10px 3px;
  }
`;

//export async function getStaticProps() {
//  const res = await fetch();
//  const post = await res.json();
//}
