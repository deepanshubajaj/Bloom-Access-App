import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Formik } from "formik";
import { Octicons } from "@expo/vector-icons";

import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    TextInput
} from "react-native";

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
    StyledButton,
    ButtonText,
    Colors,
    MsgBox,
    Line,
    ExtraView,
    ExtraText,
    TextLink,
    TextLinkContent
} from "./../components/styles";

import { ActivityIndicator } from "react-native";
import axios from "axios";
import { baseAPIUrl } from "../components/shared";

const { brand, darkLight, primary } = Colors;

const ForgottenPassword = ({ navigation }) => {
    const [message, setMessage] = useState();
    const [messageType, setMessageType] = useState();
    const [showModal, setShowModal] = useState(false);
    const [email, setEmail] = useState("");
    const [resetLink, setResetLink] = useState("");
    const [userId, setUserId] = useState("");
    const [resetString, setResetString] = useState("");
    const [enteredCode, setEnteredCode] = useState(""); // Stores user input

    // Handle form submission for forgotten password
    const handlePasswordReset = (values, setSubmitting) => {
        setMessage(null);

        const url = `${baseAPIUrl}/user/requestPasswordReset`;

        axios
            .post(url, {
                email: values.email,
                redirectUrl: "google.com"
            })
            .then((response) => {
                const result = response.data;
                const { status, message, resetLink, userId, resetString } = result;

                if (status === "PENDING") {
                    setEmail(values.email);
                    setResetLink(resetLink);
                    setUserId(userId);
                    setResetString(resetString);
                    setMessage(message);
                    setMessageType("SUCCESS");
                    setShowModal(true); // Show modal with input field
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
                <PageLogo resizeMode="cover" source={require("./../assets/img/emailImage.png")} />
                <PageTitle>Bloom Access</PageTitle>
                <SubTitle>Password Reset</SubTitle>

                <Formik
                    initialValues={{ email: "", redirectUrl: "google.com" }}
                    onSubmit={(values, { setSubmitting }) => {
                        if (values.email === "") {
                            setMessage("Please enter your email address");
                            setSubmitting(false);
                        } else {
                            handlePasswordReset(values, setSubmitting);
                        }
                    }}
                >
                    {({ handleChange, handleBlur, handleSubmit, values, isSubmitting }) => (
                        <StyledFormArea>
                            <View>
                                <LeftIcon>
                                    <Octicons name="mail" size={30} color={brand} />
                                </LeftIcon>
                                <StyledInputLabel>Email Address</StyledInputLabel>
                                <StyledTextInput
                                    placeholder="example@gmail.com"
                                    placeholderTextColor={darkLight}
                                    onChangeText={handleChange("email")}
                                    onBlur={handleBlur("email")}
                                    value={values.email}
                                    keyboardType="email-address"
                                />
                            </View>

                            <MsgBox type={messageType}>{message}</MsgBox>

                            {!isSubmitting && (
                                <StyledButton onPress={handleSubmit}>
                                    <ButtonText>Send Reset Link</ButtonText>
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
                                <TextLink onPress={() => navigation.replace("Login")}>
                                    <TextLinkContent>Login</TextLinkContent>
                                </TextLink>
                            </ExtraView>
                        </StyledFormArea>
                    )}
                </Formik>
            </InnerContainer>

            {/* Modal for Code Verification */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showModal}
                onRequestClose={() => setShowModal(false)}
            >
                <View style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    padding: 20,
                }}>
                    <View style={{
                        backgroundColor: "white",
                        padding: 20,
                        borderRadius: 10,
                        width: "80%",
                        alignItems: "center",
                    }}>
                        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>Enter Reset Code</Text>
                        <Text style={{ fontSize: 16, textAlign: "center", marginBottom: 10 }}>
                            We have sent a reset code to {email}. Please enter it below.
                        </Text>

                        {/* Input Field for Reset Code */}
                        <TextInput
                            style={{
                                height: 50,
                                borderColor: darkLight,
                                borderWidth: 1,
                                width: "100%",
                                paddingHorizontal: 10,
                                borderRadius: 5,
                                fontSize: 16,
                                marginBottom: 15,
                                textAlign: "center"
                            }}
                            placeholder="Enter Code"
                            placeholderTextColor={darkLight}
                            value={enteredCode}
                            onChangeText={(text) => setEnteredCode(text)}
                        />

                        {/* Proceed Button (Only Enabled if Code Matches) */}
                        <StyledButton
                            onPress={() => {
                                if (enteredCode === resetLink) {
                                    setShowModal(false);
                                    navigation.replace("NewPasswordScreen", { userId, resetString });
                                } else {
                                    setMessage("Invalid code. Please try again.");
                                    setMessageType("ERROR");
                                }
                            }}
                            disabled={enteredCode !== resetLink}
                            style={{ opacity: enteredCode === resetLink ? 1 : 0.5 }}
                        >
                            <ButtonText>Proceed</ButtonText>
                        </StyledButton>

                        <TouchableOpacity
                            style={{
                                marginTop: 10,
                                padding: 10
                            }}
                            onPress={() => setShowModal(false)}
                        >
                            <Text style={{ color: primary, fontWeight: "bold" }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </StyledContainer>
    );
};

export default ForgottenPassword;
