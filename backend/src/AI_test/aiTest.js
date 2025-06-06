const axios = require('axios');

// const payload = {
//   chat_history: [
//     { username: "user1", message: "가족이랑 8월 초에 국내로 여행 가려고 해" },
//     { username: "user2", message: "가족 여행 좋죠! 어떤 지역을 선호하시나요?" },
//     { username: "user1", message: "너무 더운 곳은 좀 그렇고, 자연 풍경이 좋았으면 해" }
//   ],
//   user_question: "그럼 어디로 가는 게 좋을까? 그리고 어디서 자는게 좋을까?"
// };

// axios.post('http://localhost:4000/api/v1/ai/prompt-generation', payload)
//   .then(response => {
//     console.log("응답 결과:", response.data);
//   })
//   .catch(error => {
//     if (error.response) {
//       console.error("서버 오류:", error.response.data);
//     } else {
//       console.error("요청 실패:", error.message);
//     }
//   });


const payload = {
  chat_history: [
    // { username: "user1", message: "가족이랑 8월 초에 국내로 여행 가려고 해" },
    // { username: "user2", message: "가족 여행 좋지! 어떤 지역이 좋을까까?" },
    // { username: "user1", message: "자연 풍경이 좋았으면 해" }
  ],
  user_question: "출발지는 김포이고 제주도 가는 항공편 추천해줘"
};

axios.post('http://localhost:4000/api/v1/ai/ai-test', payload)
  .then(response => {
    console.log("응답 결과:", response.data);
  })
  .catch(error => {
    if (error.response) {
      console.error("서버 오류:", error.response.data);
    } else {
      console.error("요청 실패:", error.message);
    }
});
