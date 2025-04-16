import React, { useState } from "react";
import { StatusBar } from 'expo-status-bar';
import { Formik } from "formik";
import { Octicons, Ionicons } from '@expo/vector-icons';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';

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

import axios from 'axios';
import { baseAPIUrl } from "../components/shared";

const { brand, darkLight, primary } = Colors;

const NewPasswordScreen = ({ navigation, route }) => {
    // Extract userId and resetString from params
    const { userId, resetString } = route.params || {};

    const [message, setMessage] = useState();
    const [messageType, setMessageType] = useState();
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [hideNewPassword, setHideNewPassword] = useState(true);
    const [hideConfirmPassword, setHideConfirmPassword] = useState(true);

    // Handle API call for password reset
    const handlePasswordReset = (values, setSubmitting) => {
        setMessage(null);

        // API URL
        const url = `${baseAPIUrl}/user/resetPassword`;

        axios
            .post(url, {
                userId,
                resetString,
                newPassword: values.newPassword
            })
            .then((response) => {
                const result = response.data;
                const { status, message } = result;

                if (status === "SUCCESS") {
                    setShowSuccessModal(true); // Show success modal
                } else {
                    setMessage(message);
                    setMessageType("ERROR");
                }
                setSubmitting(false);
            })
            .catch((error) => {
                console.log(error);
                setMessage("An error occurred. Please try again.");
                setMessageType("ERROR");
                setSubmitting(false);
            });
    };

    return (
        <StyledContainer>
            <StatusBar style="dark" />
            <InnerContainer>
                <PageLogo resizeMode="cover" source={require('./../assets/img/newPassImage.png')} />
                <PageTitle>Bloom Access</PageTitle>
                <SubTitle>Set New Password</SubTitle>

                <Formik
                    initialValues={{ newPassword: '', confirmPassword: '' }}
                    onSubmit={(values, { setSubmitting }) => {
                        if (values.newPassword === '') {
                            setMessage('Please enter a new password');
                            setSubmitting(false);
                        } else if (values.newPassword !== values.confirmPassword) {
                            setMessage('Passwords do not match');
                            setSubmitting(false);
                        } else {
                            handlePasswordReset(values, setSubmitting);
                        }
                    }}
                >
                    {({ handleChange, handleBlur, handleSubmit, values, isSubmitting }) => (
                        <StyledFormArea>
                            {/* New Password Input */}
                            <View>
                                <LeftIcon>
                                    <Octicons name={values.newPassword ? "lock" : "unlock"} size={30} color={brand} />
                                </LeftIcon>
                                <StyledInputLabel>New Password</StyledInputLabel>
                                <StyledTextInput
                                    placeholder="Enter New Password"
                                    placeholderTextColor={darkLight}
                                    onChangeText={handleChange('newPassword')}
                                    onBlur={handleBlur('newPassword')}
                                    value={values.newPassword}
                                    secureTextEntry={hideNewPassword}
                                />
                                <RightIcon onPress={() => setHideNewPassword(!hideNewPassword)}>
                                    <Ionicons
                                        name={hideNewPassword ? 'eye-off' : 'eye'}
                                        size={30}
                                        color={darkLight}
                                    />
                                </RightIcon>
                            </View>

                            {/* Confirm New Password Input */}
                            <View>
                                <LeftIcon>
                                    <Octicons name={values.confirmPassword ? "lock" : "unlock"} size={30} color={brand} />
                                </LeftIcon>
                                <StyledInputLabel>Confirm New Password</StyledInputLabel>
                                <StyledTextInput
                                    placeholder="Confirm New Password"
                                    placeholderTextColor={darkLight}
                                    onChangeText={handleChange('confirmPassword')}
                                    onBlur={handleBlur('confirmPassword')}
                                    value={values.confirmPassword}
                                    secureTextEntry={hideConfirmPassword}
                                />
                                <RightIcon onPress={() => setHideConfirmPassword(!hideConfirmPassword)}>
                                    <Ionicons
                                        name={hideConfirmPassword ? 'eye-off' : 'eye'}
                                        size={30}
                                        color={darkLight}
                                    />
                                </RightIcon>
                            </View>

                            {/* Display any response message */}
                            <MsgBox type={messageType}>{message}</MsgBox>

                            {/* Submit button */}
                            {!isSubmitting && (
                                <StyledButton onPress={handleSubmit}>
                                    <ButtonText>Reset Password</ButtonText>
                                </StyledButton>
                            )}

                            {isSubmitting && (
                                <StyledButton disabled={true}>
                                    <ActivityIndicator size="large" color={primary} />
                                </StyledButton>
                            )}

                            <Line />

                            <ExtraView>
                                <ExtraText>Remembered your password? </ExtraText>
                                <TextLink onPress={() => navigation.replace('Login')}>
                                    <TextLinkContent>Login</TextLinkContent>
                                </TextLink>
                            </ExtraView>
                        </StyledFormArea>
                    )}
                </Formik>
            </InnerContainer>

            {/* Success Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showSuccessModal}
                onRequestClose={() => setShowSuccessModal(false)}
            >
                <View style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    padding: 20,
                }}>
                    <View style={{
                        backgroundColor: 'white',
                        padding: 20,
                        borderRadius: 10,
                        width: '80%',
                        alignItems: 'center',
                    }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Password Reset Successfully!!</Text>
                        <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
                            Your password has been successfully reset. You can now proceed to login.
                        </Text>

                        {/* Proceed to Login Button */}
                        <StyledButton onPress={() => {
                            setShowSuccessModal(false);
                            navigation.replace('Login');
                        }}>
                            <ButtonText>Proceed to Login</ButtonText>
                        </StyledButton>
                    </View>
                </View>
            </Modal>
        </StyledContainer>
    );
};

export default NewPasswordScreen;
