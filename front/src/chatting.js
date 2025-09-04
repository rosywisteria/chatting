import React, { useRef, useEffect, useState } from 'react';
import { Box, VStack, HStack, Flex, Button, Text} from '@chakra-ui/react';
import { Input} from "@chakra-ui/react"
import { InputGroup } from "./components/ui/input-group"
import { LuSearch } from "react-icons/lu"

import { Toaster,toaster } from "./components/ui/toaster"
import { useLocation, useNavigate } from 'react-router-dom';

import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL;
// const API_URL = "https://chatting-3tub.onrender.com";
// const API_URL = "http://localhost:50508";


const socket = io.connect(API_URL, {transports: ["websocket"]});

function BigChat() {
    const location = useLocation();
    const navigate = useNavigate();
    const timestamp = Math.floor(Date.now()/1000);

    const [myConvos, setMyConvos]=useState([]); //list of people I've chatted with
    const [currentConvo, setCurrentConvo]=useState(''); //current person I'm chatting with

    const username = location.state.username;
    useEffect(() => {
      if (!username) return;
      const getConvos = async() => {
        const response = await fetch(`${API_URL}/api/getConvos?username=${username}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          },
        })
        if (response.ok) {
          const data = await response.json();
          console.log("convos here:", data);
          setMyConvos(data.convos);
        }
      }
      getConvos();
    }, [username]);

    const [message, setMessage] = useState('');

    const getMessages = async(chattingUser) => {
      setChattingUser(chattingUser);
      setChronologicalMessages([]);
      
      const response= await fetch(`${API_URL}/api/getMessages`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username:username, chattingUser:chattingUser}),
      });
      
      if (response.ok){
        const {myMessages, theirMessages} = await response.json();
        const allMessages = [...myMessages, ...theirMessages];
        if (allMessages.length > 0) {
          setMyConvos((prev) => {
          if (!prev.includes(chattingUser)) {
            return [...prev, chattingUser];
          }
          return prev;
        });
        }
        const allMessagesSorted = allMessages.sort((a,b) => a.timestamp - b.timestamp);
        setChronologicalMessages(allMessagesSorted);
        setToVisible("visible");
        setSendMessageEnabled(false);

      } else {
        console.error("Can't fetch messages");
      }

    }

    const sendMessage = () => {
      if (message !== '') {
      const newMessage = {
        message: message,
        sentby: username,
        receivedby: chattingUser,
        timestamp: timestamp
      }
      console.log('Sent new message:', message);
      
      socket.emit('message', {message, username, chattingUser, timestamp});
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
        const response = await fetch(`${API_URL}/api/findperson`, {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({username: searchInput}),
          credentials: "include"
        })
        if (response.ok) {
          const otherperson = await response.json();
          await getMessages(otherperson.username);
          setSearchPeople("hidden");
          setSearchInput('');

          // //gets database messages
          // const getMessages = await fetch("http://localhost:50508/api/getMessages", {
          //   method: "POST",
          //   headers: {
          //     "Accept": "application/json",
          //     "Content-Type": "application/json",
          //   },
          //   body: JSON.stringify({username: username, chattingUser: otherperson.username}),
          // })
          // if (getMessages.ok) {
          //   const {myMessages, theirMessages} = await getMessages.json();
          //   console.log({myMessages, theirMessages})
          //   const allMessages = [...myMessages, ...theirMessages];
          //   const allMessagesSorted = allMessages.sort((a, b) => a.timestamp - b.timestamp);
          //   setChronologicalMessages(allMessagesSorted);
          // }

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
      <Flex h="100vh" w="100vw" bg="gray.50" justifyContents="center">
       {/* <Flex flex="1" overflow="hidden">  */}
       <Flex w="90%" maxW="1200px" overflow="hidden" gap={1}> 
          {/* another flex for sidebar and message box */}

          {/* left sidebar for user conversations */}
          <Box w="250px" overflowY="auto">
            <VStack spacing={2} p={2}>
              {myConvos.map((user, index) => (
                <Box
                  key={index}
                  p={3}
                  w="100%"
                  cursor="pointer"
                  bg={user === currentConvo ? "#AFA9DB" : "#ebe8fc"}
                  borderRadius="md"
                  onClick={() => {
                    setCurrentConvo(user);
                    getMessages(user);
                  }}
                >
                  <Text fontWeight="bold">{user}</Text>
                </Box>
              ))}
            </VStack>
          </Box>

          {/* chat area */}
          <Box flex="1" bg="white" display="flex" flexDirection="column">
            <VStack flex="1" w="100%" overflow="hidden" spacing={0}>
              <HStack justifyContent="flex-start" alignItems="center">
                <Text fontSize="2xl">chat?</Text>
                <Text fontSize="xl" mb={4}>•  {username}  •</Text>
                <Button m="2" variant="outline" onClick={logout}>Logout</Button>
              </HStack>
        
          <Box w="40%">
            {/* Search bar */}
            <HStack mb={4}>  
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
          borderWidth="1px" 
          borderRadius="lg"
          w="60%"
          flex= "1"
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
          </Box>
        </Flex>
     </Flex>

      
    )
}
export default BigChat;