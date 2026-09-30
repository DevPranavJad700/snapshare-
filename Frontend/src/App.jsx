import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider }  from "./context/AuthContext";
import ErrorBoundary    from "./components/ErrorBoundary";
import Navbar           from "./components/Navbar";
import Footer           from "./components/Footer";
import ScrollToTop      from "./components/ScrollToTop";

import Feed        from "./pages/Feed";
import CreatePost  from "./pages/CreatePost";
import Profile     from "./pages/Profile";
import PostDetail  from "./pages/PostDetail";
import Login       from "./pages/Login";
import Register    from "./pages/Register";
import NotFound    from "./pages/NotFound";

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <ErrorBoundary>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/"            element={<Feed />} />
            <Route path="/create-post" element={<CreatePost />} />
            <Route path="/profile"     element={<Profile />} />
            <Route path="/posts/:id"   element={<PostDetail />} />
            <Route path="/login"       element={<Login />} />
            <Route path="/register"    element={<Register />} />
            <Route path="*"            element={<NotFound />} />
          </Routes>
          <Footer />
          <ScrollToTop />
        </Router>
      </ErrorBoundary>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
