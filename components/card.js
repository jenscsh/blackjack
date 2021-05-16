import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Card(props) {
    const [image, setImage] = useState('/green_back.png');
    const [value, setValue] = useState(props.card.value);
    const [suit, setSuit] = useState(props.card.suit);

    let cardImg = '';

    useEffect(() => {
        setImage(props.card.image);
        setValue(props.card.value);
        setSuit(props.card.suit);
    }, [])
    return (
        <AnimatePresence>
            <motion.img
                src={image}
                alt={value + ' of ' + suit}
                initial={{ x: 1000, rotateY: 180 }}
                animate={{ x: 0, rotateY: 0 }}
                exit={{ x: -25 }}
                style={{ maxHeight: 314 }}
            />
        </AnimatePresence>
    )
}