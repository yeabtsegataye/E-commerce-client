import { UseAuthContext } from "./useAuthContext";
import {useState, useEffect} from 'react'

 export const useValidator = ()=>{
  const API_BASE_URL = process.env.REACT_APP_URL ;

const {user, dispatch} = UseAuthContext()
const [valid ,setValid] = useState(false)

    // const Verifiy = ()=>{
useEffect(()=>{
    if(!user){
      setValid(false)
      dispatch({type: 'LOGOUT'})
      return
    }
      const tok = user.token  
    fetch(`${API_BASE_URL}/api/user/verify`, {
      method: "POST",
      headers: { authorization: `beared ${tok}` },
    })
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        const states = data.user;
        setValid(states);
        if (!states) {
          dispatch({ type: "LOGOUT" });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  },[ dispatch,user])

  return {valid}
}