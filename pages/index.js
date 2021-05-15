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
  const [remainingCards, setRemainingCards] = useState(0);
  const [playing, setPLaying] = useState(false);

  useEffect(() => {
    let id = (deckId === '' || deckId === undefined) ? 'new' : deckId;
    fetch(`https://deckofcardsapi.com/api/deck/${id}/shuffle/?deck_count=2`)
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
  }

  function BetRender() {
    return (
      <button onClick={DealHands} >PLAY</button>
    )
  }

  function PlayRender() {
    return (
      <div>
        {playerHand.map(card => {
          return (<Card card={card} />);
        })}
        <button onClick={() => setPLaying(false)} >TILBAKE</button>
      </div>
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

const GlobalStyle = createGlobalStyle``;

//export async function getStaticProps() {
//  const res = await fetch();
//  const post = await res.json();
//}
