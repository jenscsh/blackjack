import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Card(props) {
    const [image, setImage] = useState(props.card.image);
    const [value, setValue] = useState(props.card.value);
    const [suit, setSuit] = useState(props.card.suit);

    useEffect(() => {
        setImage(props.card.image);
        setValue(props.card.value);
        setSuit(props.card.suit);
    }, []);



    return (
        <motion.img src={image} alt={value + ' of ' + suit} />
    )
}