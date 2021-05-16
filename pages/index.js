import Head from 'next/head'
import Router from 'next/dist/next-server/lib/router/router'
import styles from '../styles/Home.module.css'
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { createGlobalStyle } from 'styled-components';

import Card from '../components/card';

export default function Home() {
  const [deckId, setDeckId] = useState('');
  const [playerHand, setPLayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [remainingCards, setRemainingCards] = useState(0);
  const [playing, setPLaying] = useState(false);

  const [playerScore, setPlayerScore] = useState(0);
  const [dealerScore, setDealerScore] = useState(0);

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
        console.error(error);
      })
  }, []);

  async function DealHands() {
    setPLaying(true);
    await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/shuffle/`);
    fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=2`)
      .then(response => {
        return response.json();
      })
      .then(data => {
        setPLayerHand(data.cards);
        setRemainingCards(data.remaining);
      })
      .catch(error => console.error(error));
    fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=2`)
      .then(response => {
        return response.json();
      })
      .then(data => {
        setDealerHand(data.cards);
        setRemainingCards(data.remaining);
      })
      .catch(error => console.error(error));
  }

  function ToBet() {
    setPLayerHand([]);
    setDealerHand([]);
    setPLaying(false);
  }

  function Hit() {
    fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`)
      .then(response => {
        return response.json();
      })
      .then(data => {
        setPLayerHand([...playerHand, data.cards[0]]);
        setRemainingCards(data.remaining);
      })
  }

  function BetRender() {
    return (
      <>
        <div className='topHalf'></div>
        <div className='bottomHalf'>
          <button onClick={DealHands} className='playBtn' >PLAY</button>
        </div>

      </>
    )
  }

  function PlayRender() {
    return (
      <>
        <div className='topHalf'>
          {dealerHand.map((card, index) => {
            return (<Card card={card} key={index} />);
          })}
        </div>
        <div className='bottomHalf'>
          {playerHand.map((card, index) => {
            return (<Card card={card} key={index} />);
          })}
          <button onClick={Hit} >HIT</button>
          <button onClick={ToBet} >TILBAKE</button>
        </div>
      </>
    )
  }

  return (
    <>
      <GlobalStyle />
      {playing ? <PlayRender /> : <BetRender />}
      <p>Remaining Cards: {remainingCards}</p>
    </>
  )
}

const GlobalStyle = createGlobalStyle`
  .topHalf {
    background: lightblue;
    width: 100vw;
    height: 50vh;
  }
  .bottomHalf {
    background: pink;
    width: 100vw;
    height: 50vh;
  }
  .playBtn {
    position: absolute;
    bottom: 10px;
    right: 10px;
    width: 10rem;
    height: 10rem;
    border-radius: 50%;
    font-size: 2rem;
  }
`;

//export async function getStaticProps() {
//  const res = await fetch();
//  const post = await res.json();
//}
