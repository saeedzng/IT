import "./App.css";
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { User } from '@supabase/supabase-js';
import { TonConnectButton } from "@tonconnect/ui-react";
import { useTonConnectUI } from '@tonconnect/ui-react';
import WebApp from "@twa-dev/sdk";
// import {extractTransactionDetails} from "./translateResult"
declare global { interface Window { Telegram: any; } }



function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page_n, setPageN] = useState(Number(0));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [tonConnectUI] = useTonConnectUI();
  const [transactionResult, setTransactionResult] = useState<Object | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [haverow, setHaverow] = useState(false);
  const [referal_address, setReferal_address] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState("");


  useEffect(() => {
    const ReferalAddressFromUrl = window.Telegram.WebApp.initDataUnsafe.start_param;
    if (ReferalAddressFromUrl) {
      setReferal_address(ReferalAddressFromUrl);
    }
  }, []);

  const handleShare = () => {
    if (!user) {
      WebApp.showAlert("You Must Sign In");
      return;
    }
    if (haverow) {
      WebApp.showAlert("You Must Buy a Product First.");
      return;
    }
    const telegramShareUrl ='https://t.me/M_tg25bot/TestApp?startapp=' + "'" + user.email + "'" ;
    if (navigator.share) {
      navigator.share({
        title: 'Chicken Farm ',
        text: 'Send it to share',
        url: telegramShareUrl,
      })
    } else {
      showFallback(telegramShareUrl);
    }
  };
  const showFallback = (url: string) => {
    setShareUrl(url);
    setShowShareDialog(true);
  };
  const copyToClipboard = () => {
    const tempTextarea = document.createElement("textarea");
    tempTextarea.value = shareUrl;
    document.body.appendChild(tempTextarea);
    tempTextarea.select(); document.execCommand("copy");
    document.body.removeChild(tempTextarea);
    WebApp.showAlert("Link copied to clipboard!");
  };
  const closeShareDialog = () => {
    setShowShareDialog(false);
  };










  const handleSendTransaction = async () => {
    try {
      const result = await tonConnectUI.sendTransaction({
        validUntil: Date.now() + 5 * 60 * 1000,
        messages: [
          {
            address: "0QDbP6nFnSSS1dk9EHL5G_bYG0cIqPBwv1eje7uOGiVZcno8",
            amount: "10000000"
          }
        ]
      });
      setTransactionResult(result);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };
  useEffect(() => {
    if (transactionResult !== null) {
      console.log("MYCode : Confrim");
      handleChange();
    }
  }, [transactionResult]);


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
      .insert([{ OwnerAddress: user.email, ReferalAddress: "111111", LeftID: 1, RightID: 2 }]);

    if (error) {
      console.error('Error creating row:', error);
    } else {
      console.log('Row created successfully');
    }
  };

  const handleChange = async () => {
    if (!user) {
      console.error('User not logged in');
      return;
    }
    const { error } = await supabase
      .from('Users')
      .insert([{ OwnerAddress: user.email, ReferalAddress: referal_address }]);

    if (error) {
      console.error('Error creating row:', error);
    } else {
      console.log('Row created successfully');
      setHaverow(true)
    }
    let ownerAddress: string | null = 'saeed.zng@gmail.com';
    let referalAddress: string | null;
    const { data: referalData, error: referalError } = await supabase
      .from('Users')
      .select('ReferalAddress')
      .eq('OwnerAddress', ownerAddress)
      .single();

    if (referalError) {
      console.error('Error fetching ReferalAddress:', referalError);
      return;
    }
    referalAddress = referalData.ReferalAddress;
    while (referalAddress) {
      const { data, error } = await supabase
        .from('Users')
        .select('RightPoint , RightID , LeftPoint , LeftID , ReferalAddress , OwnerAddress')
        .eq('OwnerAddress', referalAddress)
        .single();

      if (error) {
        console.error('Error fetching RightPoint or ReferalAddress:', error);
        return;
      }
      const currentRightPoint: number = data.RightPoint;
      const currentLeftPoint: number = data.LeftPoint;
      const rightID: string = data.RightID;
      const leftID: string = data.LeftID;
      const nextReferalAddress: string | null = data.ReferalAddress;
      const nextOwnerAddress: string | null = data.OwnerAddress;
      let feutureRightPoint = currentRightPoint;
      let feutureLeftPoint = currentLeftPoint;
      if (ownerAddress === rightID) {
        feutureRightPoint = currentRightPoint + 1;
      }
      if (ownerAddress === leftID) {
        feutureLeftPoint = currentLeftPoint + 1;
      }
      const { error: updateError } = await supabase
        .from('Users')
        .update({ RightPoint: feutureRightPoint, LeftPoint: feutureLeftPoint })
        .eq('OwnerAddress', referalAddress);

      if (updateError) {
        console.error('Error updating RightPoint:', updateError);
        return;
      } else {
        console.log(`Point for ${referalAddress} updated successfully`);
      }
      referalAddress = nextReferalAddress;
      ownerAddress = nextOwnerAddress;
    }
  };

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
                {/* <button onClick={ extract }>extract</button> */}
                <button className="action-button" onClick={handleShare}>Share Referal</button>
                {/* Share Dialog */}
                {showShareDialog && (
                  <div className="dialog-overlay">
                    <div className="dialog-content">
                      <h2>Your browser does not support sharing.</h2>
                      <p>Please copy the link below and share it manually:</p>
                      <label>{shareUrl}</label>
                      <div className="dialog-buttons">
                        <button onClick={copyToClipboard}>Copy Link</button>
                        <button onClick={closeShareDialog}>Close</button>
                      </div>
                    </div>
                  </div>
                )}

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
