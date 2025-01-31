import React, { useState } from 'react';
import { Button, Input, Stack, Flex} from "@chakra-ui/react";
import { Field } from "./components/ui/field"
import { PasswordInput } from "./components/ui/password-input"
import { useForm } from "react-hook-form";
import { Tabs } from "@chakra-ui/react"
import { useNavigate } from 'react-router-dom';
import { Toaster,toaster } from "./components/ui/toaster"


function Login() {
    const {
        register,
        handleSubmit,
        formState: { errors },
      } = useForm();

    const navigate = useNavigate();
    
    const onSubmit = async(data) => {
        const user = {
            username: data.username,
            password: data.password,
        }
        if (SubmitTitle === "Submit") {
            const loginpost = "http://localhost:50508/api/login"
            const response = await fetch(loginpost, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(user),
            })
            if (response.ok) {
                const result = await response.json();
                console.log("Login successful:", result);
                navigate("/messagepage", { state: { username: result.username } }); 
            } else{
                toaster.create({
                    description: "invalid username or password",
                    duration: 6000,
                    type: "error",
                  })
            }
        } else {
            const signuppost = "http://localhost:50508/api/signup";
            const response = await fetch(signuppost, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(user),
            })
            if (response.ok) {
                const result = await response.json();
                console.log("Account created, successful:", result);
                toaster.create({
                    description: "created new account. enjoy!",
                    duration: 6000,
                    type: "success",
                  })
                navigate("/messagepage", { state: { username: result.username } }); 
                
            } else {
                toaster.create({
                          description: "Cannot create account, account already exists",
                          duration: 6000,
                          type: "error",
                        })
            }
        }
    }
    const [SubmitTitle, setSubmitTitle] = useState("Submit");

    const toggleLogin = (bluh) => {
        if (bluh==="Login") {
            console.log("Login");
            setSubmitTitle("Submit");
        } else {
            console.log("Create new");
            setSubmitTitle("Create new account");
        }
    }   

    const [visible, setVisible] = useState(false);
    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Flex justify="center" align="center" h="100vh">
                <Stack gap="4" align="flex-start" maxW="sm">
                    <Flex>
                    <Tabs.Root key="enclosed"
                    index={SubmitTitle=== "Login" ? 0 : 1} 
                    onChange={(index) => toggleLogin(index === 0 ? "Login" : "Signup")}>
                        <Tabs.List>
                            <Tabs.Trigger value="Login" onClick={() => toggleLogin("Login")}> Login </Tabs.Trigger>
                            <Tabs.Trigger value="Signup" onClick={() => toggleLogin("Signup")}> Signup </Tabs.Trigger>
                            <Tabs.Indicator rounded="l2"/>
                        </Tabs.List>
                        <Tabs.Content />
                    </Tabs.Root>
                    </Flex>
                    
                    <Field
                    label="Username"
                    invalid={!!errors.username}
                    errorText={errors.username?.message}
                    >
                    <Input
                        {...register("username", { required: "Username is required" })}
                    />
                    </Field>

                    <Field
                    label="Password"
                    invalid={!!errors.password}
                    errorText={errors.password?.message}
                    >
                    <PasswordInput
                        visible={visible}
                        onVisibleChange={setVisible}
                        {...register("password", { required: "Password is required" })}
                    />
                    </Field>

                    <Button type="submit" >{SubmitTitle}</Button>
                    <Toaster />
                </Stack>
            </Flex>
      </form>
    )
}
export default Login;