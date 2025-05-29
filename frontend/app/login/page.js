import { redirect } from 'next/navigation'

import Image from 'next/image';
import {Roboto} from 'next/font/google'

export default function Home() {
    return(
        <div style={{height:'100vh', width:'100vw', position:'relative'}}>
            <Image
                src="/main.png"
                alt="login page"
                fill
                style={{objectFit: 'cover'}} 
                priority           
            />
            <div
                style={{position: 'absolute',
                    top: 0,
                    right: 0,
                    height: '100vh',
                    width: '350px',
                    backgroundColor: 'white',
                    zIndex:10,
                }} //하얀색 창
            >
                <div style={{position: 'absolute', left:'50%', top:'50%', alignItems:'center',transform: 'translate(-50%,-50%)',display: 'flex', flexDirection:'column', gap:'15px',}}>
                    <div style={{display: 'flex', alignItems:'center', gap: '5px',}}>
                        <Image
                            src="/logo_white.png"
                            alt="login page_logo"
                            width='50'
                            height='50'
                        /> 
                        <span style={{fontFamily: 'Roboto, sans-serif', fontWeight: 200,fontSize: '30px', color: '#84CDEE'}}>
                            SENA.AI
                        </span>  
                    </div>
                    <input
                        type='text'
                        placeholder="Enter Your Username"
                        style={{
                            width: '250px',
                            height: '40px',
                            padding: '8px 12px',
                            borderRadius: '5px',
                            border: '1px solid #84CDEE',
                            outline: 'none',
                            fontSize: '12px',
                            fontFamily:'Roboto, sans-serif',
                            color: '#84CDEE',
                        }}
                    />
                    <button
                        style={{
                            width: '250px',
                            height: '40px',
                            padding: '8px 12px',
                            borderRadius: '20px',
                            border: 'none',
                            backgroundColor: '#84CDEE',
                            outline: 'none',
                            fontSize: '12px',
                            fontFamily:'Roboto, sans-serif',
                            color: 'white',
                            fontWeight: 700,
                            cursor: 'pointer',
                        }}
                    >
                        LOGIN
                    </button>
                </div>
            </div>
        </div>
    );
}
