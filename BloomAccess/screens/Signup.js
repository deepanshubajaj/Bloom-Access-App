import React, { useState, useContext } from "react";
import { StatusBar } from 'expo-status-bar';

// formik
import { Formik } from "formik";

// icons
import { Octicons, Ionicons } from '@expo/vector-icons';

import {
    StyledContainer,
    InnerContainer,
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

import { View, TouchableOpacity, ActivityIndicator, Pressable, Platform, StyleSheet } from 'react-native';

// colors
const { brand, darkLight, primary, secondary } = Colors;

// Datetimepicker
import DateTimePicker from '@react-native-community/datetimepicker';

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

const Signup = ({ navigation }) => {
    const [hidePassword, setHidePassword] = useState(true);
    const [hideConfirmPassword, setHideConfirmPassword] = useState(true);
    const [show, setShow] = useState(false);
    const [date, setDate] = useState(new Date(2000, 0, 1));

    const [message, setMessage] = useState();
    const [messageType, setMessageType] = useState();

    // Actual dob value to be sent
    const [dob, setDob] = useState(null)

    // Credentials Context
    const { storedCredentials, setStoredCredentials } = useContext(CredentialsContext);

    const onChange = ({ type }, selectedDate) => {
        if (type == 'set') {
            const currentDate = selectedDate || date;
            setDate(currentDate);

            if (Platform.OS == "android") {
                showDatePicker()
                setDob(currentDate);
            }
        } else {
            showDatePicker()
        }
    };

    const showDatePicker = () => {
        //setShow('date');
        setShow(!show);
    };

    const confirmIOSDate = () => {
        setDob(date);
        showDatePicker();
    }

    // Form Handling
    const handleSignup = async (credentials, setSubmitting) => {
        handleMessage(null);
        const url = `${baseAPIUrl}/user/signup`;

        credentials.dateOfBirth = dob.toDateString();

        axios
            .post(url, credentials)
            .then((response) => {
                const result = response.data;
                const { message, status, data } = result;

                if (status !== 'PENDING') {
                    handleMessage(message, status);
                } else {
                    temporaryUserPersist(({ email, name, dateOfBirth } = credentials))
                    navigation.navigate('Verification', { ...data });
                    //persistLogin({ ...data }, message, status);
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

    const temporaryUserPersist = async (credentials) => {
        try {
            await AsyncStorage.setItem('tempUser', JSON.stringify(credentials))
        } catch (error) {
            handleMessage("Error with initial data handling.")
        }

    }

    const handleMessage = (message, type = '') => {
        setMessage(message);
        setMessageType(type);
    };

    // Persisting login
    const persistLogin = (credentials, message, status) => {
        AsyncStorage.setItem('bloomAccessCredentials', JSON.stringify(credentials))
            .then(() => {
                handleMessage(message, status);
                setStoredCredentials(credentials);
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
                    <PageTitle>Bloom Access</PageTitle>
                    <SubTitle> Account Signup</SubTitle>

                    {show && (
                        <DateTimePicker
                            testID="dateTimePicker"
                            value={date}
                            mode="date"
                            is24Hour={true}
                            display="spinner"
                            onChange={onChange}
                            style={styles.datePicker}
                            maximumDate={new Date(2100, 1, 1)}
                            minimumDate={new Date(1900, 1, 1)}
                        />
                    )}

                    {show && Platform.OS == "ios" && (
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                width: "100%",
                                paddingHorizontal: 70,
                            }}
                        >
                            <StyledButton style={{ marginRight: 0 }} onPress={showDatePicker}>
                                <ButtonText>Cancel</ButtonText>
                            </StyledButton>

                            <StyledButton style={{ marginLeft: 0 }} onPress={confirmIOSDate}>
                                <ButtonText>Confirm</ButtonText>
                            </StyledButton>
                        </View>
                    )}


                    <Formik
                        initialValues={{ name: '', email: '', dateOfBirth: '', password: '', ConfirmPassword: '' }}
                        onSubmit={(values, { setSubmitting }) => {
                            values = { ...values, dateOfBirth: dob };
                            if (values.email == '' || values.password == '' || values.name == '' || values.dateOfBirth == '' || values.ConfirmPassword == '') {
                                handleMessage('Please fill all the fields');
                                setSubmitting(false)
                            } else if (values.password !== values.ConfirmPassword) {
                                handleMessage('Paswords do not match');
                                setSubmitting(false)
                            } else {
                                handleSignup(values, setSubmitting);
                            }
                        }}
                    >{({ handleChange, handleBlur, handleSubmit, values, isSubmitting }) => (<StyledFormArea>
                        <MyTextInput
                            label="Full Name"
                            icon="person"
                            placeholder="John Doe"
                            placeholderTextColor={darkLight}
                            onChangeText={handleChange('name')}
                            onBlur={handleBlur('name')}
                            value={values.name}
                        />

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

                        {!show && (
                            <Pressable
                                onPress={showDatePicker}
                            >
                                <MyTextInput
                                    label="Date of Birth"
                                    icon="calendar"
                                    placeholder="YYYY - MM - DD"
                                    placeholderTextColor={darkLight}
                                    onChangeText={handleChange('dateOfBirth')}
                                    onBlur={handleBlur('dateOfBirth')}
                                    value={dob ? dob.toDateString() : ''}
                                    isDate={true}
                                    editable={false}
                                    onPressIn={showDatePicker}
                                //showDatePicker={showDatePicker} 
                                />
                            </Pressable>
                        )}

                        <MyTextInput
                            label="Password"
                            icon="lock"
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

                        <MyTextInput
                            label="Confirm Password"
                            icon="lock"
                            placeholder="* * * * * * * *"
                            placeholderTextColor={darkLight}
                            onChangeText={handleChange('ConfirmPassword')}
                            onBlur={handleBlur('ConfirmPassword')}
                            value={values.ConfirmPassword}
                            secureTextEntry={hideConfirmPassword}
                            isPassword={true}
                            hidePassword={hideConfirmPassword}
                            setHidePassword={setHideConfirmPassword}
                        />

                        <MsgBox type={messageType}>{message}</MsgBox>

                        {!isSubmitting && (
                            <StyledButton onPress={handleSubmit}>
                                <ButtonText>Signup</ButtonText>
                            </StyledButton>
                        )}

                        {isSubmitting && (
                            <StyledButton disabled={true}>
                                <ActivityIndicator size="large" color={primary} />
                            </StyledButton>
                        )}

                        <Line />
                        <ExtraView>
                            <ExtraText>Already have an account? </ExtraText>
                            <TextLink onPress={() => navigation.navigate('Login')}>
                                <TextLinkContent>Login</TextLinkContent>
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

const MyTextInput = ({ label, icon, isPassword, hidePassword, setHidePassword, isDate, showDatePicker, ...props }) => {
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
            {!isDate && <StyledTextInput {...props} />}
            {isDate && (
                <TouchableOpacity onPress={showDatePicker}>
                    <StyledTextInput {...props} />
                </TouchableOpacity>
            )}
            {isPassword && (
                <RightIcon onPress={() => setHidePassword(!hidePassword)}>
                    <Ionicons name={hidePassword ? 'eye-off' : 'eye'} size={30} color={darkLight} />
                </RightIcon>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    datePicker: {
        backgroundColor: secondary,
        height: 120,
        marginTop: -10,
    },
});

export default Signup;