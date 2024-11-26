import "../App.css";
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { User } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';
import { TonConnectButton } from "@tonconnect/ui-react";
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error(error);
      } else {
        setUser(data?.session?.user ?? null);
      }
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
    } else {
      setUser(null);
      console.log('Signed out successfully!');
    }
  };

  return (
    <div className="wrapper">
      <div className="top-section">
        <div className="header">
          <div className="left">
            <img src="./logo.png" alt="Logo" className="logo" />
          </div>
          <div className="right">
            <TonConnectButton />
          </div>
        </div>
        <nav className="menu">
          <ul>
            <li><button onClick={() => navigate('/')}>Home</button></li>
            <li><button onClick={() => navigate('/login')}>Login</button></li>
            <li><button onClick={() => navigate('/SignUp')}>SignUp</button></li>
          </ul>
        </nav>
      </div>
      <div className="down-section" >
        <h3>Home</h3>
        {user ? (
          <div>
            <p>Welcome, {user.email}</p>
            <button onClick={handleSignOut}>Sign Out</button>
          </div>
        ) : (
          <div>
            <p>Please log in</p>
            <Link to="/login">Login</Link>
            <br />
            <Link to="/signup">Sign Up</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
