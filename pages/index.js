import Head from 'next/head'
import Router from 'next/dist/next-server/lib/router/router'
import styles from '../styles/Home.module.css'
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { createGlobalStyle } from 'styled-components';

import Card from '../components/card';

export default function Home() {
  //Lagrer iden til kortstokken, slik at man kan bruke samme kortstokk
  const [deckId, setDeckId] = useState('');

  //Hendene til spiller og dealer. Split brukes ikke.
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [splitHand, setSplitHand] = useState([]);

  //Spillerens totale pengebeløp og hvor mye de har satset. remainingCards er til debug
  const [money, setMoney] = useState(3000);
  const [betMoney, setBetMoney] = useState(0);
  const [remainingCards, setRemainingCards] = useState(0);

  //Hvis playing ikke er sant, kan spilleren satse penger i bet screen
  const [playing, setPlaying] = useState(false);
  //Når denne ikke er en tom string, regnes runden som over
  const [roundOverMsg, setRoundOverMsg] = useState("");

  //Mens stand er sant, trekker dealer inn til de har minst 17 i verdi
  const [stand, setStand] = useState(false);
  //Hvis hideCard er sant, gjemmes det ene kortet til dealeren
  const [hideCard, setHideCard] = useState(false);

  //Når playError ikke er tom, vises error-boksen
  const [playError, setPlayError] = useState("");

  //Henter inn stokk ved lasting og tar vare på id
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

  //Trekker kort for dealer, når de skal flere kort
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

  //Sjekker om spilleren har trukket inn mer enn 21 i verdi, i såfall slutter runden
  useEffect(() => {
    if (CalculateScore(playerHand) > 21) EndRound();
  }, [playerHand]);

  //Kjører blackjack-sjekk hver gang spiller eller dealer sin hånd blir endret
  useEffect(() => {
    CheckBlackJack();
  }, [playerHand, dealerHand]);

  //Tilbakestiller feilmelding når bet blir satt
  useEffect(() => setPlayError(""), [betMoney]);

  //Sjekker om spiller, dealer eller begge har fått blackjack
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

  //Tar seg av feil som skulle oppstå og vil gå til bet screen hvis den får beskjed om det
  function HandleError(error, abort = false) {
    console.error(error);
    setPlayError("Error: " + error);
    if (abort) {
      setMoney(money + betMoney);
      ToBet();
    }
  }

  //Deler ut kort til spiller og dealer, hvis det skjer en feil vil HandleError få beskjed om å gå tilbake til bet
  async function DealHands() {
    setPlayError("");
    if (betMoney === 0) {
      setPlayError("Error: Need bet to start the game");
      return;
    }
    if (betMoney > money) {
      setPlayError("Error: You don't have enough money");
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
        setPlaying(true);
      })
      .catch(error => HandleError(error, true));
    await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=2`)
      .then(response => {
        return response.json();
      })
      .then(data => {
        setDealerHand(data.cards);
        setRemainingCards(data.remaining);
        setPlaying(true);
      })
      .catch(error => HandleError(error, true));
    setMoney(money - betMoney);
  }

  //Avslutter runden og beregner score, setter dermed roundOverMsg
  function EndRound() {
    setHideCard(false);
    const playerScore = CalculateScore(playerHand);
    const dealerScore = CalculateScore(dealerHand);
    if (playerScore > 21) setRoundOverMsg("Player bust! You lose.");
    else if (dealerScore > 21) {
      setRoundOverMsg("Dealer bust! You win $" + betMoney * 2 + "!");
      setMoney(money + betMoney * 2);
    } else if (playerScore > dealerScore) {
      setRoundOverMsg("Player win! You win $" + betMoney * 2 + "!")
      setMoney(money + betMoney * 2);
    } else if (playerScore < dealerScore) setRoundOverMsg("Dealer win! You lose.");
    else if (playerScore === dealerScore) {
      setRoundOverMsg("Push! You get your bet back.");
      setMoney(money + betMoney);
    }
  }

  //Brukes til å beregne score til en hånd den mottar, trekker fra ti hvis hånda er over 21 og den har et ess
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

  //Tømmer hender og roundOverMsg, stokker stokken, går tilbake til bet screen
  function ToBet() {
    fetch(`https://deckofcardsapi.com/api/deck/${deckId}/shuffle/`);
    setPlayerHand([]);
    setDealerHand([]);
    setRoundOverMsg("");
    setPlaying(false);
  }

  //Trekker ett kort for spillerhånda, brukes til Hit eller Double
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

  //Brukes til Double, trekker ett kort til spiller og setter stand
  function Double() {
    setBetMoney(betMoney * 2);
    Hit();
    setStand(true);
  }

  return (
    <>
      <GlobalStyle />
      {/* Error baren vises bare ved errors */}
      {(playError !== "") ? <h3 id="errorBar">{playError}</h3> : null}
      {playing ?
        // Hvis playing er sant ser vi spillbrettet
        <>
          {/* Den øvre delen av brettet er dealer sin halvdel */}
          <div className='topHalf'>
            {/* Spillerens satsing */}
            <h1 style={{ backgroundColor: "white", padding: 10, fontSize: '1.3em', border: "3px solid black", display: 'block', maxWidth: 200 }}>Your bet: ${betMoney}</h1>
            {/* Dealer hånd */}
            <div className="hand" aria-label="Dealer's hand" aria-hidden="false">
              <AnimatePresence>
                {dealerHand.map((card, index) => {
                  let r = index === 1 ? hideCard : false;
                  return (<Card card={card} hide={r} key={index} />);
                })}
              </AnimatePresence>
            </div>
            {/* Dealer score */}
            <h2 style={{textAlign: 'end'}}>Dealer Score: {roundOverMsg === "" & !stand && dealerHand.length > 0 ? CalculateScore([dealerHand[0]]) : CalculateScore(dealerHand)}</h2>
          </div>
          {/* Den nedre delen tilhører spilleren */}
          <div className='bottomHalf'>
            {/* Spillerens hånd */}
            <div className="hand" aria-label="Player's hand" aria-hidden="false">
              <AnimatePresence>
                {playerHand.map((card, index) => {
                  return (<Card card={card} hide={false} key={index} />);
                })}
              </AnimatePresence>
            </div>
            {/* Spiller score */}
            <h2 style={{textAlign: 'end'}}>Player Score: {CalculateScore(playerHand)}</h2>
            {/* Spillerens knapper, SPLIT er bare en hit knapp for nå */}
            {roundOverMsg === "" && !stand ?
              <nav id='gameBtns'>
                {playerHand.length === 2 && CalculateScore([playerHand[0]]) === CalculateScore([playerHand[1]]) ? <button onClick={Hit} >SPLIT</button> : null}
                {playerHand.length === 2 ? <button onClick={Double} >DOUBLE</button> : null}
                <button onClick={Hit} >HIT</button>
                <button onClick={() => setStand(true)} >STAND</button>
              </nav> :
              // Nytt spill-knapp, vises når spillet er over
              roundOverMsg !== "" ?
                <div id="roundOver">
                  <h1>{roundOverMsg}</h1>
                  <button className="gnrlBtn" onClick={ToBet} >NEW GAME</button>
                </div> : null
            }
          </div>
        </> : money > 0 ?

          //Bet Screen, hvor spilleren kan satse penger
          <>
            <div className='topHalf'>
              {/* Hvor mye spilleren vil satse */}
              <h1 style={{ fontSize: '1.3em', backgroundColor: "white", padding: 10, border: "3px solid black", maxWidth: 200 }}>Your bet: ${betMoney}</h1>
              <button className="gnrlBtn" onClick={() => setBetMoney(0)}>RESET BET</button>
            </div>
            <div className='bottomHalf'>
              {/* Chips som spiller kan bruke til å satse penger */}
              <div id="chips">
                <button className="chip" aria-label="Add bet" onClick={() => setBetMoney(betMoney + 10)}>10</button>
                <button className="chip" aria-label="Add bet" onClick={() => setBetMoney(betMoney + 50)}>50</button>
                <button className="chip" aria-label="Add bet" onClick={() => setBetMoney(betMoney + 100)}>100</button>
                <button className="chip" aria-label="Add bet" onClick={() => setBetMoney(betMoney + 500)}>500</button>
                <button className="chip" aria-label="Add bet" onClick={() => setBetMoney(betMoney + 1000)}>1000</button>
              </div>
              {/* Knapp til å starte spillet */}
              <button onClick={DealHands} className='playBtn' >PLAY</button>
              {/* Oversikt over hvor mye penger spiller har */}
              <h1 style={{ position: 'absolute', bottom: 10, left: 10, backgroundColor: "white", padding: 10, fontSize: '1.4em', border: "3px solid black" }}>You have: ${money}</h1>
            </div>
          </> :
          //Skjermen for når spilleren taper alle pengene
          <>
            <div className='topHalf'>
              <h1>You lost everything!</h1>
            </div>
            <div className='bottomHalf'>
              <button className="gnrlBtn" onClick={(() => setMoney(3000))}>START AGAIN</button>
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
    margin-right: 50px;
    flex-direction: row-reverse;
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
  .gnrlBtn {
    font-size: 1rem;
    background: lightyellow;
    margin-top: 5px;
    padding: 5px;
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
    gap: 5px;
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
    box-shadow: 0 0 5px;
    font-size: 3vh;
    background: lightblue;
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
