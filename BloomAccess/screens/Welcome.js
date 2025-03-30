import React, { useContext } from "react";
import { StatusBar } from 'expo-status-bar';

import {
    StyledContainer,
    InnerContainer,
    PageTitle,
    SubTitle,
    StyledFormArea,
    StyledButton,
    ButtonText,
    Line,
    WelcomeContainer,
    WelcomeImage,
    Avatar
} from './../components/styles';

// Async-Storage
import AsyncStorage from '@react-native-async-storage/async-storage';

// Credentials Context
import { CredentialsContext } from './../components/CredentialsContext';

const Welcome = () => {

    // Credentials Context
    const { storedCredentials, setStoredCredentials } = useContext(CredentialsContext);
    const { name, email } = storedCredentials;

    const clearLogin = () => {
        AsyncStorage.removeItem('bloomAccessCredentials')
            .then(() => {
                setStoredCredentials("");
            })
            .catch((error) => console.log(error));
    };

    return (
        <>
            <StyledContainer>
                <StatusBar style="dark" />
                <InnerContainer>
                    <WelcomeImage resizeMode="cover" source={require('./../assets/img/expo-bloomAccess2.png')} />
                    <WelcomeContainer>
                        <PageTitle welcomeelcome={true}>Welcome! Buddy</PageTitle>
                        <SubTitle welcome={true}>{`👉 ${name}` || 'Checker'}</SubTitle>
                        <SubTitle welcome={true}>{email || 'checker@gmail.com'}</SubTitle>
                        <StyledFormArea>
                            <Avatar resizeMode="cover" source={require('./../assets/img/expo-bloomAccess3.png')} />
                            <Line />
                            <StyledButton
                                onPress={clearLogin}
                            >
                                <ButtonText>Logout</ButtonText>
                            </StyledButton>
                        </StyledFormArea>
                    </WelcomeContainer>
                </InnerContainer>
            </StyledContainer>
        </>
    );
};

export default Welcome;