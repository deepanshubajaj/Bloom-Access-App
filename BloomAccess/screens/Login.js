import React, { useState, useContext } from "react";
import { StatusBar } from 'expo-status-bar';

// formik
import { Formik } from "formik";

// icons
import { Octicons, Ionicons, Fontisto } from '@expo/vector-icons';

import {
    StyledContainer,
    InnerContainer,
    PageLogo,
    PageTitle,
    SubTitle,
    StyledFormArea,
    LeftIcon,
    StyledInputLabel,
    StyledTextInput,
    RightIcon,
    StyledButton,
    ButtonText,
    Colors,
    MsgBox,
    Line,
    ExtraView,
    ExtraText,
    TextLink,
    TextLinkContent
} from './../components/styles';
import { View, ActivityIndicator } from 'react-native';

// colors
const { brand, darkLight, primary } = Colors;

// keyboard avoiding view
import KeyboardAvoidingWrapper from './../components/KeyboardAvoidingWrapper';

// API Client
import axios from 'axios';

// Async-Storage
import AsyncStorage from '@react-native-async-storage/async-storage';

// Credentials Context
import { CredentialsContext } from './../components/CredentialsContext';

// Api Route
import { baseAPIUrl } from "../components/shared";

// Import the ENV object from env.js
import { ENV } from './../env';

// Google Sign-in
import {
    GoogleSignin,
    GoogleSigninButton,
    statusCodes,
} from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
    webClientId: ENV.GOOGLE_WEB_CLIENT_ID,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    offlineAccess: true,
    forceCodeForRefreshToken: false,
    iosClientId: ENV.GOOGLE_IOS_CLIENT_ID,
});

const Login = ({ navigation, route }) => {
    const [hidePassword, setHidePassword] = useState(true);
    const [message, setMessage] = useState();
    const [messageType, setMessageType] = useState();

    // Credentials Context
    const { storedCredentials, setStoredCredentials } = useContext(CredentialsContext);

    const handleLogin = (credentials, setSubmitting) => {
        handleMessage(null);
        const url = `${baseAPIUrl}/user/signin`;

        axios
            .post(url, credentials)
            .then((response) => {
                const result = response.data;
                const { message, status, data } = result;

                if (status !== 'SUCCESS') {
                    handleMessage(message, status);
                } else {
                    persistLogin({ ...data[0] }, message, status);
                }
                setSubmitting(false);
            })
            .catch(error => {
                console.log(error.response ? error.response.data : error.message);
                //console.log(error.JSON());
                setSubmitting(false);
                handleMessage("An error occurred. Check your network and try again");
            });
    }

    const handleMessage = (message, type = '') => {
        setMessage(message);
        setMessageType(type);
    };

    // Add this function inside the Login component
    const handleGoogleSignin = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const response = await GoogleSignin.signIn();
            console.log("Google Sign-In Response:", response);

            // Check if response has the necessary properties
            if (response && response.data && response.data.user) {
                console.log("userInfo from Google Sign-In: ", response.data.user);
                persistLogin(response.data.user, "Google sign-in successful", "SUCCESS");
            } else {
                console.log("Sign-in was unsuccessful or user info is missing");
            }

        } catch (error) {
            if (error && error.code) {
                switch (error.code) {
                    case statusCodes.IN_PROGRESS:
                        // Operation (e.g., sign in) already in progress
                        console.log("Sign in is already in progress");
                        break;
                    case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
                        // Android only, play services not available or outdated
                        console.log("Play services are not available or outdated");
                        break;
                    default:
                        // Some other error happened
                        console.error("Unknown error:", error);
                }
            } else {
                // This is an error not related to Google SignIn
                console.error("An unknown error occurred:", error);
            }
        }
    };

    // Persisting login (both for Google and normal login)
    const persistLogin = (credentials, message, status) => {
        AsyncStorage.setItem('bloomAccessCredentials', JSON.stringify(credentials))
            .then(() => {
                handleMessage(message, status);
                setStoredCredentials(credentials);
                navigation.navigate('Welcome');
            })
            .catch((error) => {
                handleMessage('Persisting login failed');
                console.log(error);
            });
    };

    return (
        <KeyboardAvoidingWrapper>
            <StyledContainer>
                <StatusBar style="dark" />
                <InnerContainer>
                    <PageLogo resizeMode="cover" source={require('./../assets/img/expo-bloomAccess1.png')} />
                    <PageTitle>Bloom Access</PageTitle>
                    <SubTitle> Account Login</SubTitle>

                    <Formik
                        initialValues={{ email: route?.params?.email, password: '' }}
                        enableReinitialize={true}
                        onSubmit={(values, { setSubmitting }) => {
                            if (values.email == '' || values.password == '') {
                                handleMessage('Please fill all the fields');
                                setSubmitting(false)
                            } else {
                                handleLogin(values, setSubmitting);
                            }
                        }}
                    >{({ handleChange, handleBlur, handleSubmit, values, isSubmitting }) => (<StyledFormArea>
                        <MyTextInput
                            label="Email Address"
                            icon="mail"
                            placeholder="example@gmail.com"
                            placeholderTextColor={darkLight}
                            onChangeText={text => handleChange('email')(text.toLowerCase())}
                            onBlur={handleBlur('email')}
                            value={values.email}
                            keyboardType="email-address"
                        />

                        <MyTextInput
                            label="Password"
                            //icon="lock"
                            placeholder="* * * * * * * *"
                            placeholderTextColor={darkLight}
                            onChangeText={handleChange('password')}
                            onBlur={handleBlur('password')}
                            value={values.password}
                            secureTextEntry={hidePassword}
                            isPassword={true}
                            hidePassword={hidePassword}
                            setHidePassword={setHidePassword}
                        />
                        <MsgBox type={messageType}>{message}</MsgBox>

                        {!isSubmitting && (
                            <StyledButton onPress={handleSubmit}>
                                <ButtonText>Login</ButtonText>
                            </StyledButton>
                        )}

                        {isSubmitting && (
                            <StyledButton disabled={true}>
                                <ActivityIndicator size="large" color={primary} />
                            </StyledButton>
                        )}

                        <Line />
                        <StyledButton google={true} onPress={handleGoogleSignin}>
                            <Fontisto name="google" color={primary} size={25} />
                            <ButtonText google={true}>Sign in with Google</ButtonText>
                        </StyledButton>

                        {/* Forgot Password Button */}
                        <TextLink onPress={() => navigation.navigate('ForgottenPassword')}>
                            <TextLinkContent>Forgot Password?</TextLinkContent>
                        </TextLink>

                        <ExtraView>
                            <ExtraText>Don't have an account already? </ExtraText>
                            <TextLink onPress={() => navigation.navigate('Signup')}>
                                <TextLinkContent>Signup</TextLinkContent>
                            </TextLink>
                        </ExtraView>

                    </StyledFormArea>
                    )}
                    </Formik>
                </InnerContainer>
            </StyledContainer>
        </KeyboardAvoidingWrapper>
    );
}

const MyTextInput = ({ label, icon, isPassword, hidePassword, setHidePassword, ...props }) => {
    return (
        <View>
            <LeftIcon>
                <Octicons
                    name={isPassword ? (props.value ? "lock" : "unlock") : icon}
                    size={30}
                    color={brand}
                />
            </LeftIcon>
            <StyledInputLabel>{label}</StyledInputLabel>
            <StyledTextInput {...props} />
            {isPassword && (
                <RightIcon onPress={() => setHidePassword(!hidePassword)}>
                    <Ionicons name={hidePassword ? 'eye-off' : 'eye'} size={30} color={darkLight} />
                </RightIcon>
            )}
        </View>);
}

export default Login;

