import ShowEmployees from "./pages/showEmployees"

const App = () => {
  return (
    <div>
      <ShowEmployees/>
    </div>
  )
}

export default App
// import { useEffect, useState } from 'react'
// import './App.css'
// import './index.css'
// import Login from './pages/Login';
// import Register from './pages/Register';

// // tiny hash router: #/login -> Login, anything else -> Register
// const getPage = () => (window.location.hash === '#/login' ? 'login' : 'register')

// const App = () => {
//   const [page, setPage] = useState(getPage)

//   useEffect(() => {
//     const onHash = () => setPage(getPage())
//     window.addEventListener('hashchange', onHash)
//     return () => window.removeEventListener('hashchange', onHash)
//   }, [])

//   return (
//     <div>
//       {page === 'login' ? <Login /> : <Register />}
//     </div>
//   )
// }

// export default App
