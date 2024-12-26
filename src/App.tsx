import "./App.css";
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { User } from '@supabase/supabase-js';
import { TonConnectButton } from "@tonconnect/ui-react";
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import WebApp from "@twa-dev/sdk";
import { Address, beginCell } from "ton-core";
// import {extractTransactionDetails} from "./translateResult"
declare global { interface Window { Telegram: any; } }



function App() {
  const [page_n, setPageN] = useState(Number(0));
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [logedInUserEmail, setLogedInUserEmail] = useState('Guest');
  const [welcomeDisplayName, setWelcomeDisplayName] = useState('Guest');
  const [error, setError] = useState<string | null>(null);
  const [tonConnectUI] = useTonConnectUI();
  const [transactionResult, setTransactionResult] = useState<Object | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  // const [loading, setLoading] = useState(true);
  const [haverow, setHaverow] = useState(false);
  const [referal_address, setReferal_address] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState(""); 
  const logedInUserTonAddress = useTonAddress();



  

  useEffect(() => {
    const ReferalAddressFromUrl = window.Telegram.WebApp.initDataUnsafe.start_param;
    if (ReferalAddressFromUrl) {
      setReferal_address(ReferalAddressFromUrl);
    }
  }, []);



  const handleShare = async () => {
    if (!user) {
      WebApp.showAlert("You Must Sign In");
      return;
    }
    if (!haverow) {
      WebApp.showAlert("You Must Buy a Product First.");
      return;
    }
    const { data, error } = await supabase
      .from('Users')
      .select('id')
      .eq('OwnerAddress', user.email)
      .single();
    if (data) {
      const telegramShareUrl = `https://t.me/M_tg25bot/TestApp?startapp=${data.id}`;
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
    if (error) {
      WebApp.showAlert('Error :' + error);
    } else {
      console.log('share successfully');
    }
  }
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











  const updateShareRateInMaster = async () => {
    try {
      // Fetch all users and calculate the total sum of Points
      const { data: totalPointsResult, error: totalPointsError } = await supabase
        .from('Users')
        .select('Points');
      if (totalPointsError) {
        throw new Error(`Error fetching total points: ${totalPointsError.message}`);
      }
      // Calculate the total sum of Points
      const totalPoints = totalPointsResult.reduce((acc, user) => acc + user.Points, 0);
      let share_data_cell = beginCell()
        .storeUint(2, 32)
        .storeUint(totalPoints, 32)
        .endCell();
      const result = await tonConnectUI.sendTransaction({
        validUntil: Date.now() + 5 * 60 * 1000,
        messages: [
          {
            address: "EQDyWf37qCDELuFMGIAdgQkrg4Z5lclgvEddBISOktGc0K1J",
            amount: "10000000",
            payload: share_data_cell.toBoc().toString("base64"),
          }
        ]
      });
      if (result) {
        WebApp.showAlert("ShareRate updated successfully")
      }
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };





  async function handleSendPaybackOrder() {
    try {
      // Fetch the first three users with Points greater than zero
      const { data: users, error: fetchError } = await supabase
        .from('Users')
        .select('TonAddress, Points')
        .gt('Points', 0)
        .limit(3);

      if (fetchError) {
        throw new Error(`Error fetching users: ${fetchError.message}`);
      }

      // Create user array
      const userArray = users.map(user => ({
        TonAddress: user.TonAddress,
        Points: user.Points
      }));

      // Create the datacell for the current batch
      let datacellBuilder = beginCell()
        .storeUint(3, 32)
        .storeUint(userArray.length, 32); // Number of users in the current batch

      // Add each user's address and points to the datacell
      userArray.forEach(user => {
        datacellBuilder
          .storeAddress(Address.parse(user.TonAddress))
          .storeCoins(user.Points);
      });

      const datacell = datacellBuilder.endCell();

      try {
        const result = await tonConnectUI.sendTransaction({
          validUntil: Date.now() + 5 * 60 * 1000,
          messages: [
            {
              address: "EQDyWf37qCDELuFMGIAdgQkrg4Z5lclgvEddBISOktGc0K1J",
              amount: "10000000",
              payload: datacell.toBoc().toString("base64"),
            }
          ]
        });

        if (result) {
          // Set Points to zero for the current batch of users
          const { error: updateError } = await supabase
            .from('Users')
            .update({ Points: 0 })
            .in('TonAddress', users.map(user => user.TonAddress));

          if (updateError) {
            throw new Error(`Error updating users: ${updateError.message}`);
          }
        }
      } catch (error) {
        console.error('Error sending transaction:', error);
      }

      // Return the user array and total points
      // return { userArray, sumP };

    } catch (error) {
      console.error('Error processing user points:', error);
    }
  }














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
      console.log("Transactin Confrimed");
      handleBuyPointForUppers();
    }
  }, [transactionResult]);


  useEffect(() => {
    const getUser = async () => {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
            console.error(error);
        } else {
            setUser(data?.session?.user ?? null);
            if (data?.session?.user) {
                const displayName = await fetchUserDisplayName(data.session.user);
                setWelcomeDisplayName(displayName);
                setLogedInUserEmail(data.session.user.email ?? 'Guest');
            }
        }
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
            const fetchAndSetDisplayName = async () => {
                const displayName = await fetchUserDisplayName(session.user);
                setWelcomeDisplayName(displayName);
                setLogedInUserEmail(session.user.email ?? 'Guest');
            };
            fetchAndSetDisplayName();
        }
    });

    return () => {
        authListener.subscription.unsubscribe();
    };
}, []);


  // useEffect(() => {
  //    console.log("logedInUserEmail is " + logedInUserEmail);
  // }, [logedInUserEmail]);
  

  const fetchUserDisplayName = async (user: User) => {
    try {
      const displayName = user.user_metadata?.display_name;
      if (!displayName) {
        console.error('Display name not found');
        return 'Guest'; // Default display name
      }
      return displayName;
    } catch (error) {
      console.error('Error fetching display name:', error);
      return 'Guest'; // Default display name
    }
  };


  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Add displayName to the sign-up data
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName  // Ensure to add displayName in your form data
        }
      }
    });

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
    // Fetch the current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Error fetching session:', sessionError.message);
      return;
    }

    // Check if there is an active session
    if (!sessionData?.session) {
      console.error('No active session found!');
      return;
    }

    // Proceed to sign out if there is an active session
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
    } else {
      setUser(null);
      console.log('Signed out successfully!');
    }
  };


  async function updateUsersPoints() {
    try {
      // Fetch all users
      const { data: users, error: fetchError } = await supabase
        .from('Users')
        .select('id, RightPoint, LeftPoint');

      if (fetchError) {
        throw new Error(`Error fetching users: ${fetchError.message}`);
      }

      // Iterate over each user and update points
      for (const user of users) {
        const { id, RightPoint, LeftPoint } = user;
        const maxPoint = Math.min(RightPoint, LeftPoint);

        // Update the user's points
        const { error: updateError } = await supabase
          .from('Users')
          .update({
            Points: maxPoint,
            RightPoint: 0,
            LeftPoint: 0
          })
          .eq('id', id);

        if (updateError) {
          console.error(`Error updating user with id ${id}: ${updateError.message}`);
        }
      }

      console.log('Users points updated successfully');
    } catch (error) {
      console.error('Error updating users points:', error);
    }
  }


  const handleCreateNewRowInUserstbl = async () => {
    try {
        // Fetch ReferalAddress and RightID, LeftID in a single query
        const { data: userData, error: fetchError } = await supabase
            .from('Users')
            .select('OwnerAddress, RightID, LeftID')
            .eq('id', referal_address)
            .single();

        if (fetchError) {
            console.error('Error fetching data for creating new row in tbl:', fetchError);
            return;
        }

        const emailShapeReferalAddress = userData?.OwnerAddress;
        const { RightID, LeftID } = userData;

        // Insert new row for new user
        const { error: insertError } = await supabase
            .from('Users')
            .insert([{ OwnerAddress: user!.email, ReferalAddress: emailShapeReferalAddress, TonAddress: logedInUserTonAddress }]);

        if (insertError) {
            console.error('Error creating row:', insertError);
            return;
        } else {
            console.log('Row created successfully');
            setHaverow(true);
        }

        if (RightID === null) {
            // If RightID is null, update it with the logged-in user's email
            const { error: updateError } = await supabase
                .from('Users')
                .update({ RightID: user!.email })
                .eq('id', referal_address);

            if (updateError) {
                console.error('Error updating RightID:', updateError);
            } else {
                console.log('RightID updated to', user!.email);
            }
        } else if (LeftID === null) {
            // If RightID is not null but LeftID is null, update LeftID with the logged-in user's email
            const { error: updateError } = await supabase
                .from('Users')
                .update({ LeftID: user!.email })
                .eq('id', referal_address);

            if (updateError) {
                console.error('Error updating LeftID:', updateError);
            } else {
                console.log('LeftID updated to', user!.email);
            }
        } else {
            // If neither RightID nor LeftID is null, log their values
            console.log('NOTHING UPDATED RightID and LeftID have values:', { RightID, LeftID });
        }
    } catch (error) {
        console.error('Unexpected error:', error);
    }
};







  const handleBuyPointForUppers = async () => {
    if (!user) {
      console.error('User not logged in');
      return;
    }
    if (!haverow) {
      handleCreateNewRowInUserstbl();
    }

    
    
    let ownerAddress: string | null = logedInUserEmail;
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
    await fetchData();
  };

  useEffect(() => {
    if (logedInUserEmail === 'Guest') return; 
    fetchData(); 
}, [logedInUserEmail]);

const fetchData = async () => {
  const { data, error } = await supabase
      .from('Users')
      .select();
  console.log('Fetched data:', data);

  if (error) {
      console.error('Error fetching data:', error);
  } else {
      setTableData(data);
      const owner = data.find(row => row.OwnerAddress === logedInUserEmail);
      setHaverow(!!owner);
      console.log("logedInUserEmail is " + logedInUserEmail);
      console.log("have row is " + !!owner);
  }
  // setLoading(false);
};




  // if (loading) return <div>Loading...</div>;

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
            <li key={2}><button onClick={() => setPageN(3)}>Admin</button></li>
          </ul>
        </nav>
      </div>
      <div className="down-section">
        {page_n === 0 && (
          <div>
            {user ? (
              <div>
                <p>Welcome, {welcomeDisplayName}</p>
                <div>
                  <h4>Data from Supabase</h4>
                  <ul>
                    {tableData.map((row) => (
                      <li key={row.id}>
                        {row.OwnerAddress}, LP: {row.LeftPoint}, RP: {row.RightPoint}, Referal: {row.ReferalAddress}
                      </li>
                    ))}
                  </ul>
                </div>
                <button className="action-button" onClick={handleSendTransaction}>Buy Product</button>
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
                <br />
                <br />
                <br />
                <br />
                <button className="action-button" onClick={() => setPageN(1)}>Log in</button>
              </div>
            )}
          </div>
        )}
        {page_n === 1 && (
          <div className="form-container">
            <h2>Login</h2>
            {user ? (
              <div>
                <p>Logged In: {user.email}</p>
                <button onClick={handleSignOut}>Sign Out</button>
              </div>
            ) : (
              <div>
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
                <p>
                  I don't have an account?
                  <a href="#sign-up" onClick={() => setPageN(2)}> Sign Up</a>
                </p>
              </div>

            )}
          </div>
        )}

        {page_n === 2 && (
          <div className="form-container">
            <h2>Sign Up</h2>
            <form onSubmit={handleSignUp}>
              <div>
                <label>Display Name:</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
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

            {/* Link to Login Section */}
            <p>
              Already have an account?
              <a href="#login" onClick={() => setPageN(1)}> Login</a>
            </p>
          </div>

        )}
        {page_n === 3 && (
          <div >
            <button className="action-button" onClick={handleBuyPointForUppers}>Give buy points to uppers</button>
            <button className="action-button" onClick={updateUsersPoints}>Convert buypoints to real Points</button>
            <button className="action-button" onClick={handleSendPaybackOrder}>Payback</button>
            <button className="action-button" onClick={updateShareRateInMaster}>Update share rate in master</button>
          </div>
        )}

      </div>
    </div>
  );
};

export default App;
