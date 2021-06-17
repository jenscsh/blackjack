import { useAnimation, motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Card(props) {
    //Verdier som blir hentet inn om kortet + referanse til kortrygg-bilde
    const cardback = '/green_back.png';
    const [image, setImage] = useState(cardback);
    const [value, setValue] = useState(props.card.value);
    const [suit, setSuit] = useState(props.card.suit);
    const [hide, setHide] = useState(props.hide);

    //Animasjonsreferanse
    const ani = useAnimation();

    //De forskjellige animasjonene som brukes
    const variants = {
        init: { x: -200, rotateY: 180 },
        reveal: { x: 0, rotateY: 0 },
        hidden: { x: 0, rotateY: 180 }
    }

    //Endrer på verdiene når props blir forandret
    useEffect(() => {
        setImage(props.card.image);
        setValue(props.card.value);
        setSuit(props.card.suit);
        setHide(props.hide);
    }, [props]);

    //Bytter mellom skjult kort og framvist når hide endres
    useEffect(() => {
        if (hide) ani.start("hidden");
        else ani.start("reveal");
    }, [hide]);

    return (
        //Beholder for to bilder som gir en 3D effekt
        <motion.div
            transition={{ duration: 1, type: "tween", ease: "easeOut", }}
            variants={variants}
            initial="init"
            animate={ani}
            exit={{ x: -25 }}
            style={{ transformStyle: "preserve-3d", width: 70, margin: 0 }}
        >
            <motion.img
                src={image}
                alt={value + ' of ' + suit}
                style={FrontCardStyle}
                aria-hidden={hide ? "true" : "false"}
            />
            <motion.img
                src={cardback}
                alt="A card with the face down"
                style={BackCardStyle}
                aria-hidden={hide ? "false" : "true"}
            />
        </motion.div>
    )
}

const FrontCardStyle = {
    height: 10 + 'rem',
    backfaceVisibility: 'hidden',
    position: "absolute",
    zIndex: 2,
    // boxShadow: "5px 10px 3px"
}
const BackCardStyle = {
    height: 10 + 'rem',
    backfaceVisibility: 'hidden',
    zIndex: 1,
    transform: 'rotateY(180deg)',
    // boxShadow: "5px 10px 3px"
}