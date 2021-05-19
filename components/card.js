import { useAnimation, motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Card(props) {
    const cardback = '/green_back.png';
    const [image, setImage] = useState(cardback);
    const [value, setValue] = useState(props.card.value);
    const [suit, setSuit] = useState(props.card.suit);
    const [hide, setHide] = useState(props.hide);

    const ani = useAnimation();

    const variants = {
        init: { x: 100, rotateY: 180 },
        reveal: { x: 0, rotateY: 0 },
        hidden: { x: 0, rotateY: 180 }
    }

    useEffect(() => {
        setImage(props.card.image);
        setValue(props.card.value);
        setSuit(props.card.suit);
        setHide(props.hide);
    }, [props]);

    useEffect(() => {
        if (hide) ani.start("hidden");
        else ani.start("reveal");
    }, [hide]);

    return (
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
            />
            <motion.img
                src={cardback}
                alt="Back of card"
                style={BackCardStyle}
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