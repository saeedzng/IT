import "./App.css";
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { User } from '@supabase/supabase-js';
import { TonConnectButton } from "@tonconnect/ui-react";
import { useTonConnect } from "./hooks/useTonConnect";
import { Address  } from "ton-core";




function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page_n, setPageN] = useState(Number(0));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { connected, sender } = useTonConnect();






 const handleSendTransaction = async () => {
  if (!connected) {
    console.log("Not connected to TonConnect.");
    return;
  }

  try {
    await sender.send({
      to: Address.parse("0QDbP6nFnSSS1dk9EHL5G_bYG0cIqPBwv1eje7uOGiVZcno8"),
      value: BigInt(80000) ,
    });

    // Assuming you have a way to get the transaction ID or hash
    const transactionId = "some-transaction-id"; // Replace with actual logic to get ID

    // Check if the transaction is confirmed
    const isConfirmed = await checkTransactionStatus(transactionId);
    
    if (isConfirmed) {
      console.log("Transaction confirmed successfully!");
    } else {
      console.log("Transaction not confirmed.");
    }
  } catch (error) {
    console.error("Error during transaction:", error);
  }
};

// Example function to check transaction status
async function checkTransactionStatus(transactionId: string): Promise<boolean> {
  // Implement your logic here to query the blockchain for transaction status
  // This could involve calling an API or using a library that interacts with the blockchain
  // For example:
  
  try {
    const response = await fetch(`https://api.yourblockchain.com/transaction/${transactionId}`);
    const data = await response.json();
    
    return data.status === 'confirmed'; // Adjust based on actual response structure
  } catch (error) {
    console.error("Error checking transaction status:", error);
    return false; // Return false if there's an error checking status
  }
}

  



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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
    } else {
      setError(null);
      console.log('Signed up successfully!');
      setPageN(1);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      setError(null);
      console.log('Logged in successfully!');
      setPageN(0);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
    } else {
      setUser(null);
      console.log('Signed out successfully!');
    }
  };

  const handleBuy = async () => {
    if (!user) {
      console.error('User not logged in');
      return;
    }
    const { error } = await supabase
      .from('Users')
      .insert([{ OwnerAddress: user.email, ReferalID: 111111, LeftID: 111111, RightID: 111111 }]);

    if (error) {
      console.error('Error creating row:', error);
    } else {
      console.log('Row created successfully');
    }
  };

  const handleChange = async () => {
    let currentEmail: string | null = 'saeed.zng@gmail.com';
    let referalAddress: string | null = null;

    const { data: referalData, error: referalError } = await supabase
      .from('Users')
      .select('ReferalAddress')
      .eq('OwnerAddress', currentEmail)
      .single();

    if (referalError) {
      console.error('Error fetching ReferalAddress:', referalError);
      return;
    }
    referalAddress = referalData.ReferalAddress;
    while (referalAddress) {
      const { data, error } = await supabase
        .from('Users')
        .select('RightPoint, ReferalAddress')
        .eq('OwnerAddress', referalAddress)
        .single();

      if (error) {
        console.error('Error fetching RightPoint or ReferalAddress:', error);
        return;
      }
      const currentRightPoint: number = data.RightPoint;
      const nextReferalAddress: string | null = data.ReferalAddress;
      const { error: updateError } = await supabase
        .from('Users')
        .update({ RightPoint: currentRightPoint + 1 })
        .eq('OwnerAddress', referalAddress);

      if (updateError) {
        console.error('Error updating RightPoint:', updateError);
        return;
      } else {
        console.log(`RightPoint for ${referalAddress} updated successfully`);
      }
      referalAddress = nextReferalAddress;
    }
  };







  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('Users')
        .select();
      console.log('Fetched data:', data);

      if (error) {
        console.error('Error fetching data:', error);
      } else {
        setData(data);
      }
      setLoading(false);
    };

    fetchData();
  }, []);
  if (loading) return <div>Loading...</div>;

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
            <li key={0}><button onClick={() => setPageN(0)}>Home</button></li>
            <li key={1}><button onClick={() => setPageN(1)}>Login</button></li>
            <li key={2}><button onClick={() => setPageN(2)}>SignUp</button></li>
          </ul>
        </nav>
      </div>
      <div className="down-section">
        {page_n === 0 && (
          <div>
            <h3>Home</h3>
            {user ? (
              <div>
                <p>Welcome, {user.email}</p>
                <div>
                  <h4>Data from Supabase</h4>
                  <ul> {data.map((row) => (<li key={row.id}>{row.OwnerAddress}</li>))} </ul>
                </div>
                <button onClick={handleBuy}>BUY</button>
                <button onClick={handleChange}>CHANGE</button>
                <button onClick={handleSendTransaction}>TRANSFER 1 TON</button>

              </div>
            ) : (
              <div>
                <p>Please log in</p>
                <button onClick={() => setPageN(1)}>Log in</button>
                <br />
                <button onClick={() => setPageN(2)}>Sign up</button>
              </div>
            )}
          </div>
        )}
        {page_n === 1 && (
          <div className="form-container">
            <h2>Login</h2>
            {user ? (
              <div>
                <p>Logged In :, {user.email}</p>
                <button onClick={handleSignOut}>Sign Out</button>
              </div>
            ) : (
              <form onSubmit={handleLogin}>
                <div>
                  <label>Email:</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label>Password:</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="error-message">{error}</p>}
                <button type="submit">Login</button>
              </form>
            )}
          </div>
        )}
        {page_n === 2 && (
          <div className="form-container">
            <h2>Sign Up</h2>
            <form onSubmit={handleSignUp}>
              <div>
                <label>Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Password:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="error-message">{error}</p>}
              <button type="submit">Sign Up</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
