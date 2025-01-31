import React, { useRef, useEffect, useState } from 'react';
import { Box, VStack, HStack, Flex, Button, Text} from '@chakra-ui/react';
import { Input} from "@chakra-ui/react"
import { InputGroup } from "./components/ui/input-group"
import { LuSearch } from "react-icons/lu"

import { Toaster,toaster } from "./components/ui/toaster"
import { useLocation, useNavigate } from 'react-router-dom';

import io from 'socket.io-client';

const socket = io.connect('http://localhost:50508');

function BigChat() {
    const location = useLocation();
    const navigate = useNavigate();
    const timestamp = Math.floor(Date.now()/1000);

    const [totalusers,setTotalUsers]=useState([]);
    // const getallUsers = async() => {
    //   const response = await fetch("http://localhost:50508/api/users");
    //   const data = await response.json();
    //   setTotalUsers(data);
    //   console.log(data,'total users');
    // }

    const [message, setMessage] = useState('');
    const username = location.state.username;

    const sendMessage = () => {
      if (message !== '') {
      socket.emit('message', {message, username, chattingUser, timestamp});
      console.log('Sent new message:', message);
      setMessage('');
      }
    };  
    useEffect(() => {
      const retrieveMessage = (data) => {
        console.log('Received new message:', data.message);
        setChronologicalMessages((prevMessages) => [
          ...prevMessages,
          {
            message: data.message,
            sentby: data.username,
            receivedby: data.chattingUser,
            timestamp: data.timestamp,
          },
          
        ]);
        setMessage('');
      }
      
      socket.on('getMessage',retrieveMessage);
      return () => {
        socket.off('getMessage', retrieveMessage);
      };
    }, []);

    const logout = () => {
        navigate("/");
    }

    const [chattingUser, setChattingUser] = useState('');

    const [ChronologicalMessages, setChronologicalMessages] = useState([]);
    const findPerson = async() => {
      // setSearchPeople("hidden");
      if (searchInput=== username || searchInput === '') {
        toaster.create({
          description: "Invalid chat member",
          duration: 6000,
          type: "error",
        })
        setSearchInput('');
      } else{
        const response = await fetch("http://localhost:50508/api/findperson", {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({username: searchInput}),
        })
        if (response.ok) {
          const otherperson = await response.json();
          setChattingUser(otherperson.username);
          setChronologicalMessages([]);
          setSearchPeople("hidden");

          //gets database messages
          const getMessages = await fetch("http://localhost:50508/api/getMessages", {
            method: "POST",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({username: username, chattingUser: otherperson.username}),
          })
          if (getMessages.ok) {
            const {myMessages, theirMessages} = await getMessages.json();
            console.log({myMessages, theirMessages})
            const allMessages = [...myMessages, ...theirMessages];
            const allMessagesSorted = allMessages.sort((a, b) => a.timestamp - b.timestamp);
            setChronologicalMessages(allMessagesSorted);
          }

          setToVisible("visible");
          setSendMessageEnabled(false);
          setSearchInput('');
        } else{
          setSearchInput('');
          toaster.create({
            description: "Person doesn't exist",
            duration: 6000,
            type: "error",
          })
        }
    }
  } 

    const [searchpeople, setSearchPeople] = useState("hidden");
    const [searchInput, setSearchInput] = useState('');

    const [toVisible, setToVisible] = useState("hidden");
    const [sendMessageEnabled, setSendMessageEnabled] = useState(true);

    const SearchSubmit = (event) => {
      setSearchInput(event.target.value);
    }

    const messageBottomRef = useRef(null);
    const scrollToBottom = () => {
      messageBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    useEffect(() => {
      scrollToBottom();
    }, [ChronologicalMessages]);

    return (
      <VStack h="100vh" w="100vw" overflow="hidden" spacing={0}>
        <HStack justifyContent="flex-start" alignItems="center">
          <Text fontSize="2xl">chat?</Text>
          <Text fontSize="xl" mb={4}>•  {username}  •</Text>
          <Button m="2" variant="outline" onClick={logout}>Logout</Button>
        </HStack>
      
        <Box w="40%">
          {/* Search bar */}
          <HStack>  
            <InputGroup
              flex="1"
              startElement={<LuSearch />}
              visibility="visible"
            >
              <Input placeholder="Search people"
              value={searchInput}
              onChange={SearchSubmit}
              />
            </InputGroup>
            <Button colorScheme="black" onClick={findPerson}>Chat</Button>
          </HStack>
        </Box>
        <Text fontSize="lg" visibility={toVisible}>to: {chattingUser}</Text>
        <Flex //send message area
        position="absolute" 
        bottom="20px"
        width="40%">
            <Input 
            placeholder="Enter message" 
            value={message}
            onChange={(event) => {
                setMessage(event.target.value);}
            }
            />  
            <Button colorScheme="black" 
            onClick={sendMessage} 
            disabled={sendMessageEnabled}
            colorPalette="teal"
            >Send Message</Button>
        </Flex>

        <Box
        borderWidth="1px" borderRadius="lg"
        w="40%"
        flex= '1'
        scrollBehavior="smooth"
        overflowY="auto"
        mb="60px"
        >
          <VStack>
            {ChronologicalMessages.map((message, index) => (
              <HStack key={index} spacing={4} 
              bg={message.sentby === username ? "blue.400" : "gray.200"}
              alignSelf= {message.sentby === username ? "flex-end" : "flex-start"}
              boxShadow="md"
              borderRadius={message.sentby === username ? "20px 20px 0px 20px" : "20px 20px 20px 0px"}
              p={3}
              >
                <Text fontSize="md" >{message.message}</Text>
              </HStack>
            ))}
            <div ref={messageBottomRef} />
          </VStack>
        </Box>
        {/* <Text fontSize="lg">{totalusers}</Text> */}

        <Toaster />
      </VStack>  
    )
}
export default BigChat;