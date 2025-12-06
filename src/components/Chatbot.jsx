// src/components/Chatbot.jsx
import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";

const DESTINATIONS = {
  paris: {
    name: "Paris",
    hotels: [
      "Hotel Le Bristol Paris",
      "Shangri-La Hotel Paris",
      "Hotel Plaza Athénée",
    ],
    activities: [
      "Visit the Eiffel Tower",
      "Explore the Louvre Museum",
      "Stroll through Montmartre",
      "Walk along the Seine River",
    ],
  },
  tokyo: {
    name: "Tokyo",
    hotels: ["The Ritz-Carlton Tokyo", "Park Hyatt Tokyo", "Aman Tokyo"],
    activities: [
      "Visit Shibuya Crossing",
      "Explore Senso-ji Temple",
      "Walk around Akihabara",
      "Eat sushi at Tsukiji Market",
    ],
  },
  "new york": {
    name: "New York",
    hotels: [
      "The Plaza Hotel",
      "The St. Regis New York",
      "Park Hyatt New York",
    ],
    activities: [
      "See a Broadway show",
      "Visit Central Park",
      "Explore Times Square",
      "Walk the High Line",
    ],
  },
  santorini: {
    name: "Santorini",
    hotels: ["Canaves Oia Hotel", "Grace Hotel Santorini", "Katikies Hotel"],
    activities: [
      "Watch the sunset in Oia",
      "Visit ancient Akrotiri",
      "Relax on black sand beaches",
      "Take a boat tour of the caldera",
    ],
  },
};

const MOCK_FLIGHTS = {
  paris: [
    {
      flightNumber: "AF100",
      airline: "Air France",
      departure: "10:00 AM",
      arrival: "11:30 PM",
      price: "$650",
    },
    {
      flightNumber: "DL456",
      airline: "Delta",
      departure: "2:15 PM",
      arrival: "3:45 AM+1",
      price: "$720",
    },
  ],
  tokyo: [
    {
      flightNumber: "JAL101",
      airline: "Japan Airlines",
      departure: "1:00 PM",
      arrival: "3:30 PM+1",
      price: "$890",
    },
    {
      flightNumber: "ANA205",
      airline: "ANA",
      departure: "5:30 PM",
      arrival: "7:45 PM+1",
      price: "$850",
    },
  ],
  "new york": [
    {
      flightNumber: "AAL250",
      airline: "American Airlines",
      departure: "8:00 AM",
      arrival: "11:30 AM",
      price: "$320",
    },
    {
      flightNumber: "UAL432",
      airline: "United",
      departure: "12:00 PM",
      arrival: "3:30 PM",
      price: "$340",
    },
  ],
  santorini: [
    {
      flightNumber: "A3500",
      airline: "Aegean Airlines",
      departure: "9:00 AM",
      arrival: "2:15 PM",
      price: "$580",
    },
    {
      flightNumber: "BA234",
      airline: "British Airways",
      departure: "11:30 AM",
      arrival: "4:45 PM",
      price: "$620",
    },
  ],
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [conversationState, setConversationState] = useState("initial");
  const [userData, setUserData] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initial greeting
      addBotMessage("Hello! 👋 How can I help you today?", [
        { text: "Build me an itinerary", value: "itinerary" },
        { text: "Help me find a flight", value: "flight" },
        { text: "Help me pick a destination", value: "destination" },
      ]);
    }
  }, [isOpen]);

  const addBotMessage = (text, suggestions = []) => {
    setMessages((prev) => [
      ...prev,
      { type: "bot", text, suggestions, timestamp: new Date() },
    ]);
  };

  const addUserMessage = (text) => {
    setMessages((prev) => [
      ...prev,
      { type: "user", text, timestamp: new Date() },
    ]);
  };

  const handleSuggestionClick = (value) => {
    addUserMessage(
      messages[messages.length - 1].suggestions.find((s) => s.value === value)
        ?.text || value
    );
    processUserInput(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    addUserMessage(inputValue);
    processUserInput(inputValue);
    setInputValue("");
  };

  const processUserInput = (input) => {
    const lowerInput = input.toLowerCase().trim();

    switch (conversationState) {
      case "initial":
        if (lowerInput === "itinerary" || lowerInput.includes("itinerary")) {
          setConversationState("itinerary_destination");
          addBotMessage(
            "Great! I'd love to help you plan an itinerary. 🗺️\n\nWhere would you like to go?",
            [
              { text: "Paris", value: "paris" },
              { text: "Tokyo", value: "tokyo" },
              { text: "New York", value: "new york" },
              { text: "Santorini", value: "santorini" },
            ]
          );
        } else if (lowerInput === "flight" || lowerInput.includes("flight")) {
          setConversationState("flight_destination");
          addBotMessage(
            "I'll help you find a flight! ✈️\n\nWhat's your destination?",
            [
              { text: "Paris", value: "paris" },
              { text: "Tokyo", value: "tokyo" },
              { text: "New York", value: "new york" },
              { text: "Santorini", value: "santorini" },
            ]
          );
        } else if (
          lowerInput === "destination" ||
          lowerInput.includes("destination") ||
          lowerInput.includes("pick")
        ) {
          setConversationState("destination_city_country");
          addBotMessage(
            "Let me help you find the perfect destination! 🌍\n\nDo you prefer city or country settings?",
            [
              { text: "City", value: "city" },
              { text: "Country", value: "country" },
            ]
          );
        } else {
          addBotMessage("I didn't quite understand that. How can I help you?", [
            { text: "Build me an itinerary", value: "itinerary" },
            { text: "Help me find a flight", value: "flight" },
            { text: "Help me pick a destination", value: "destination" },
          ]);
        }
        break;

      case "itinerary_destination":
        const destKey = Object.keys(DESTINATIONS).find((key) =>
          lowerInput.includes(key)
        );
        if (destKey) {
          setUserData({ ...userData, destination: destKey });
          setConversationState("itinerary_dates");
          addBotMessage(
            `Perfect choice! ${DESTINATIONS[destKey].name} is amazing! 🎉\n\nWhen would you like to go and for how long?\n\n(Example: "January 15-20" or "Next week for 5 days")`
          );
        } else {
          addBotMessage("Please choose one of these destinations:", [
            { text: "Paris", value: "paris" },
            { text: "Tokyo", value: "tokyo" },
            { text: "New York", value: "new york" },
            { text: "Santorini", value: "santorini" },
          ]);
        }
        break;

      case "itinerary_dates":
        setUserData({ ...userData, dates: input });
        const dest = DESTINATIONS[userData.destination];
        const randomHotel =
          dest.hotels[Math.floor(Math.random() * dest.hotels.length)];
        const activities = dest.activities
          .sort(() => 0.5 - Math.random())
          .slice(0, 2);

        setConversationState("itinerary_confirm");
        addBotMessage(
          `Here's a quick itinerary for **${dest.name}**! ✨\n\n📅 **Dates:** ${input}\n\n🏨 **Hotel:** ${randomHotel}\n\n🎯 **Activities:**\n• ${activities[0]}\n• ${activities[1]}\n\nWould you like to move forward and create a full itinerary?`,
          [
            { text: "Yes, create full itinerary", value: "yes" },
            { text: "No, start over", value: "no" },
          ]
        );
        break;

      case "itinerary_confirm":
        if (lowerInput === "yes" || lowerInput.includes("yes")) {
          addBotMessage(
            `Excellent! 🎊 Your full itinerary for ${
              DESTINATIONS[userData.destination].name
            } is being created.\n\nYou can view and customize it in the Itinerary section. Would you like help with anything else?`,
            [
              { text: "Find a flight", value: "flight" },
              { text: "Start over", value: "restart" },
            ]
          );
          setConversationState("initial");
        } else {
          setConversationState("initial");
          addBotMessage("No problem! How else can I help you?", [
            { text: "Build me an itinerary", value: "itinerary" },
            { text: "Help me find a flight", value: "flight" },
            { text: "Help me pick a destination", value: "destination" },
          ]);
        }
        break;

      case "flight_destination":
        const flightDest = Object.keys(DESTINATIONS).find((key) =>
          lowerInput.includes(key)
        );
        if (flightDest) {
          setUserData({ ...userData, flightDestination: flightDest });
          setConversationState("flight_dates");
          addBotMessage(
            `Great! Searching for flights to ${DESTINATIONS[flightDest].name}. ✈️\n\nWhat dates are you looking to travel?\n\n(Example: "December 20" or "Next Friday")`
          );
        } else {
          addBotMessage("Please choose one of these destinations:", [
            { text: "Paris", value: "paris" },
            { text: "Tokyo", value: "tokyo" },
            { text: "New York", value: "new york" },
            { text: "Santorini", value: "santorini" },
          ]);
        }
        break;

      case "flight_dates":
        const flights = MOCK_FLIGHTS[userData.flightDestination];
        const flightList = flights
          .map(
            (f, i) =>
              `\n${i + 1}. **${f.airline} ${f.flightNumber}**\n   Departs: ${
                f.departure
              } → Arrives: ${f.arrival}\n   Price: ${f.price}`
          )
          .join("\n");

        setConversationState("initial");
        addBotMessage(
          `Here are the nearest flights to ${
            DESTINATIONS[userData.flightDestination].name
          } around ${input}: ✈️${flightList}\n\nWould you like help with anything else?`,
          [
            { text: "Build an itinerary", value: "itinerary" },
            { text: "Pick a destination", value: "destination" },
            { text: "Start over", value: "restart" },
          ]
        );
        break;

      case "destination_city_country":
        setUserData({ ...userData, preference: lowerInput });
        setConversationState("destination_weather");
        addBotMessage("Do you prefer cold or warm places? ❄️☀️", [
          { text: "Cold", value: "cold" },
          { text: "Warm", value: "warm" },
        ]);
        break;

      case "destination_weather":
        setUserData({ ...userData, weather: lowerInput });
        setConversationState("destination_international");
        addBotMessage("Would you like to go out of the country? 🌍", [
          { text: "Yes", value: "yes" },
          { text: "No", value: "no" },
        ]);
        break;

      case "destination_international":
        const { preference, weather } = userData;
        const international = lowerInput === "yes";
        let recommendation = "";

        if (preference === "city" && weather === "warm" && international) {
          recommendation =
            "**Tokyo, Japan** 🗾\n\nPerfect blend of modern city life, warm weather (in summer), and incredible culture!";
        } else if (
          preference === "city" &&
          weather === "cold" &&
          international
        ) {
          recommendation =
            "**Paris, France** 🗼\n\nRomantic city with beautiful winter charm, world-class museums, and amazing food!";
        } else if (
          preference === "country" &&
          weather === "warm" &&
          international
        ) {
          recommendation =
            "**Santorini, Greece** 🏖️\n\nStunning island paradise with beautiful beaches, amazing sunsets, and delicious Mediterranean cuisine!";
        } else if (preference === "city" && !international) {
          recommendation =
            "**New York City, USA** 🗽\n\nVibrant city with endless activities, world-famous landmarks, and diverse culture!";
        } else {
          recommendation =
            "**Santorini, Greece** 🌅\n\nA perfect destination with beautiful scenery and amazing experiences!";
        }

        setConversationState("initial");
        addBotMessage(
          `Based on your preferences, I recommend:\n\n${recommendation}\n\nWould you like help planning this trip?`,
          [
            { text: "Build me an itinerary", value: "itinerary" },
            { text: "Find flights", value: "flight" },
            { text: "Start over", value: "restart" },
          ]
        );
        break;

      default:
        if (lowerInput === "restart" || lowerInput.includes("start over")) {
          setConversationState("initial");
          setUserData({});
          addBotMessage("Let's start fresh! How can I help you?", [
            { text: "Build me an itinerary", value: "itinerary" },
            { text: "Help me find a flight", value: "flight" },
            { text: "Help me pick a destination", value: "destination" },
          ]);
        }
        break;
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 transition-all duration-300 hover:scale-110 z-50 group"
          aria-label="Open chat"
        >
          <MessageCircle size={28} />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center animate-pulse">
            1
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">Adventra Assistant</h3>
              <p className="text-xs text-blue-100">Always here to help! 🌍</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-2 rounded-full transition"
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg, idx) => (
              <div key={idx}>
                <div
                  className={`flex ${
                    msg.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      msg.type === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-white text-gray-800 rounded-bl-none shadow"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">
                      {msg.text
                        .split("**")
                        .map((part, i) =>
                          i % 2 === 0 ? part : <strong key={i}>{part}</strong>
                        )}
                    </p>
                  </div>
                </div>

                {/* Suggestions */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 ml-2">
                    {msg.suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionClick(suggestion.value)}
                        className="bg-white border-2 border-blue-600 text-blue-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-600 hover:text-white transition-all duration-200"
                      >
                        {suggestion.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="p-4 border-t border-gray-200 bg-white rounded-b-2xl"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition"
                aria-label="Send message"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
