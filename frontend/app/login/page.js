"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");

  const OnClickEvent = async () => {
    if (!username.trim()) {
      alert("Username을 입력해주세요.");
      return;
    }

    try {
      const response = await fetch("http://localhost:4000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });
      const data = await response.json();

      if (!response.ok) {
        console.error("로그인 실패:", data);
        alert(data.message || "로그인에 실패했습니다.");
        return;
      }

      sessionStorage.setItem("username", data.data.username);

      //채팅 페이지로 이동
      router.push("/chat");
    } catch (err) {
      console.error("서버 요청 중 에러 발생:", err);
      alert("서버 연결에 실패했습니다.");
    }
  };

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: "100vh",
          width: "80vw",
          zIndex: 1,
        }}
      >
        <Image
          src="/main.png"
          alt="login page"
          fill
          style={{ objectFit: "cover" }}
          priority
        />
      </div>
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          height: "100vh",
          width: "20vw",
          backgroundColor: "white",
          zIndex: 10,
        }} //하얀색 창
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            alignItems: "center",
            transform: "translate(-50%,-50%)",
            display: "flex",
            flexDirection: "column",
            gap: "1vh",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <Image
              src="/logo_white.png"
              alt="login page_logo"
              style={{
                width: '2.7vw',
                height: '2.7vw',
                objectFit: 'contain',
              }}
              width={500}
              height={500}
            />
            <span
              style={{
                fontFamily: "Roboto, sans-serif",
                fontWeight: 300,
                fontSize: "1.7vw",
                color: "#84CDEE",
              }}
            >
              SENA.AI
            </span>
          </div>
          <input
            type="text"
            placeholder="Enter Your Username"
            onChange={(e) => setUsername(e.target.value)}
            value={username}
            style={{
              width: "16vw",
              height: "5vh",
              padding: "8px 12px",
              borderRadius: "0.4vh",
              border: "1px solid #A0CFE4",
              outline: "none",
              fontSize: "0.8vw",
              fontFamily: "Roboto, sans-serif",
              color: "#A0CFE4",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                OnClickEvent();
              }
            }}
          />
          <button
            onClick={OnClickEvent}
            style={{
              width: "16vw",
              height: "5vh",
              // padding: "8px 12px",
              borderRadius: "20px",
              border: "none",
              backgroundColor: "#50B8E7",
              outline: "none",
              fontSize: "1vw",
              fontFamily: "Roboto, sans-serif",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            LOGIN
          </button>
        </div>
      </div>
    </div>
  );
}
