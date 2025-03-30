import React, { useState, useRef, useEffect } from "react";

import {
    CodeInputSection,
    HiddenTextInput,
    CodeInputsContainer,
    CodeInput,
    CodeInputText,
    CodeInputFocused
} from "./styles";

const CodeInputField = ({ setPinReady, code, setCode, maxLength }) => {
    const codeDigitsArray = new Array(maxLength).fill(0);

    // ref for text input
    const textInputRef = useRef(null);

    const handleOnPress = () => {
        setInputContainerIsFocused(true);
        textInputRef?.current?.focus();
    }

    // monitoring input focus
    const [
        inputContainerIsFocused,
        setInputContainerIsFocused
    ] = useState(false);

    const handleOnBlur = () => {
        setInputContainerIsFocused(false);
    }

    useEffect(() => {
        // toggle submit button state
        setPinReady(code.length === maxLength);
        return () => setPinReady(false);
    }, [code]);

    const toCodeDigitInput = (value, index) => {
        const emptyInputChar = ' ';
        const digit = code[index] || emptyInputChar;

        // formatting
        const isCurrentDigit = index === code.length;
        const isLastDigit = index === maxLength - 1;
        const isCodeFull = code.length === maxLength;

        const isDigitFocused = isCurrentDigit || (isLastDigit && isCodeFull);

        const StyledCodeInput = inputContainerIsFocused && isDigitFocused ? CodeInputFocused : CodeInput;

        return (
            <StyledCodeInput key={index}>
                <CodeInputText>{digit}</CodeInputText>
            </StyledCodeInput>
        );
    }

    return (
        <CodeInputSection>
            <CodeInputsContainer onPress={handleOnPress}>
                {codeDigitsArray.map(toCodeDigitInput)}
            </CodeInputsContainer>
            <HiddenTextInput
                ref={textInputRef}
                value={code}
                onChangeText={setCode}
                onSubmitEditing={handleOnBlur}
                keyboardType="number-pad"
                returnKeyType="done"
                textContentType="oneTimeCode"
                maxLength={maxLength}
            />
        </CodeInputSection>
    )
}

export default CodeInputField;