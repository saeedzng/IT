import "./App.css";
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { User } from '@supabase/supabase-js';
import { TonConnectButton } from "@tonconnect/ui-react";
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import WebApp from "@twa-dev/sdk";
import { Address, beginCell } from "ton-core";
import { useMasterContract } from "./hooks/useMasterContract"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faSignOut } from '@fortawesome/free-solid-svg-icons';
import { getSenderJettonWalletAddress } from './getwalletaddress';

declare global { interface Window { Telegram: any; } }

function App() {
  const [page_n, setPageN] = useState(Number(0));
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [logedInUserEmail, setLogedInUserEmail] = useState('Guest');
  const [welcomeDisplayName, setWelcomeDisplayName] = useState('Guest');
  const [error, setError] = useState<string | null>(null);
  const [tonConnectUI] = useTonConnectUI();
  const [transactionResult, setTransactionResult] = useState<Object | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  // const [loading, setLoading] = useState(true);
  const [haverow, setHaverow] = useState(false);
  const [referal_ID_FromURL, setReferal_ID_FromURL] = useState(0);
  const [referal_Email_FromURL, setreferal_Email_FromURL] = useState("");
  // const [/* referal_Ton_Address_FromURL, */, setReferal_Ton_Address_FromURL] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const logedInUserTonAddress = useTonAddress();
  const [shareRate, setShareRate] = useState(0);
  const [buy10Percent, setBuy10Percent] = useState(0);
  const [userHierarchy, setUserHierarchy] = useState<string[]>([]);
  const [HonyLogo, setHonyLogo] = useState("start");





  useEffect(() => {
    const ReferalIDFromUrl = window.Telegram.WebApp.initDataUnsafe.start_param;
    if (ReferalIDFromUrl) {
      setReferal_ID_FromURL(Number(ReferalIDFromUrl)); // Ensure it's a number
      ConvertReferalIDToReferalEmail(Number(ReferalIDFromUrl)); // Pass the value directly to the function
    }
    if (!ReferalIDFromUrl) {
      WebApp.showAlert(`You Must Open App with Rerefal ID Atachetd To The Link Other`);
      // setReferal_ID_FromURL(Number(1)); // Ensure it's a number
      // ConvertReferalIDToReferalEmail(Number(1)); // Pass the value directly to the function
    }
  }, []);

  const ConvertReferalIDToReferalEmail = async (id: number) => {
    const { data: referal_Email_Address, error: referal_Email_Error } = await supabase
      .from('Usertbl')
      .select('OwnerAddress, TonAddress')
      .eq('id', id)
      .single();

    if (referal_Email_Error) {
      console.error('Error Reading referal_Email:', referal_Email_Error);
      WebApp.showAlert(`Please make sure you are using a valid link to open the application. Your Link Must Have an ID`);
      return;
    }

    setreferal_Email_FromURL(referal_Email_Address.OwnerAddress);
    // setReferal_Ton_Address_FromURL(referal_Email_Address.TonAddress);
  };



  const master_data = useMasterContract();

  useEffect(() => {
    if (master_data && master_data.share_rate !== undefined) {
      setShareRate(master_data.share_rate);
    }
  }, [master_data]);
  
  const handleShare = async () => {
    if (!user) {
      WebApp.showAlert("You must be logged in to your account.");
      return;
    }
    if (!haverow) {
      WebApp.showAlert("You must first purchase a product.");
      return;
    }
    const { data, error } = await supabase
      .from('Usertbl')
      .select('id')
      .eq('OwnerAddress', user.email)
      .single();
    if (data) {
      const telegramShareUrl = `https://t.me/zdefailandbot/zdefailand?startapp=${data.id}`;
      if (navigator.share) {
        navigator.share({
          title: 'ZdefaiLand ',
          text: 'If you purchase using this link, you will be added to my reseller network.',
          url: telegramShareUrl,
        });
      } else {
        showFallback(telegramShareUrl);
      }
    }
    if (error) {
      WebApp.showAlert(`Error: ${error.message}`);
    } else {
      console.log('share successfully');
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


  const updateShareRateInMaster = async () => {
    try {
      // Fetch all users and calculate the total sum of Points
      const { data: totalPointsResult, error: totalPointsError } = await supabase
        .from('Usertbl')
        .select('Points');
      if (totalPointsError) {
        throw new Error(`Error fetching total points: ${totalPointsError.message}`);
      }
      // Calculate the total sum of Points
      const totalPoints = totalPointsResult.reduce((acc, user) => acc + user.Points, 0);
      let share_data_cell = beginCell()
        .storeUint(11, 32)
        .storeUint(totalPoints, 32)
        .endCell();
      const result = await tonConnectUI.sendTransaction({
        validUntil: Date.now() + 5 * 60 * 1000,
        messages: [
          {
            address: "kQD_VDXfdjRq2Nm-NOW3HwM4BFK6XBh6-8NUg4roLamJVf1s",
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
      WebApp.showAlert(`Transaction failed: ${error}`);
    }
  };


  async function handleSendPaybackOrder() {
    try {
      // Fetch the first three users with Points greater than zero
      const { data: users, error: fetchError } = await supabase
        .from('Usertbl')
        .select('OwnerAddress, TonAddress, Points, TotalGain')
        .gt('Points', 0)
        .limit(3);

      if (fetchError) {
        throw new Error(`Error fetching users: ${fetchError.message}`);
      }

      if (users.length === 0) {
        console.log('No users with Points greater than 0 found.');
        WebApp.showAlert('No users with Points greater than 0 found.');
        return;
      }

      // Create user array with gain calculations
      const userArray = users.map(user => ({
        OwnerAddress: user.OwnerAddress,
        TonAddress: user.TonAddress,
        Points: user.Points,
        TotalGain: user.TotalGain,
        GainAmount: shareRate * user.Points // Calculate gain amount
      }));

      console.log('Users fetched:', userArray);

      // Create the datacell for the current batch
      let datacellBuilder = beginCell()
        .storeUint(2, 32) // Indicates the type of transaction
        .storeUint(userArray.length, 32); // Number of users in the current batch

      // Add each user's address and points to the datacell
      userArray.forEach(user => {
        datacellBuilder
          .storeAddress(Address.parse(user.TonAddress))
          .storeCoins(user.Points);
      });

      const datacell = datacellBuilder.endCell();
      console.log('Datacell created:', datacell.toString());

      try {
        const result = await tonConnectUI.sendTransaction({
          validUntil: Date.now() + 5 * 60 * 1000, // Transaction valid for 5 minutes
          messages: [
            {
              address: "kQD_VDXfdjRq2Nm-NOW3HwM4BFK6XBh6-8NUg4roLamJVf1s",
              amount: "10000000",
              payload: datacell.toBoc().toString("base64"),
            }
          ]
        });

        if (result) {
          console.log('Transaction successful:', result);

          // Update Points, TotalGain, and LastGain for the users
          for (const user of userArray) {
            const updatedTotalGain = user.TotalGain + user.GainAmount;
            const { error: updateError } = await supabase
              .from('Usertbl')
              .update({
                Points: 0, // Reset Points to zero after transaction
                TotalGain: updatedTotalGain,
                LastGain: user.GainAmount // Store gain amount
              })
              .eq('OwnerAddress', user.OwnerAddress);

            if (updateError) {
              throw new Error(`Error updating user ${user.OwnerAddress}: ${updateError.message}`);
            }

            console.log(`User ${user.OwnerAddress} updated successfully: Points set to 0, TotalGain updated to ${updatedTotalGain}, LastGain set to ${user.GainAmount}`);
          }

          const transactionDetails = userArray.map(user => `OwnerAddress: ${user.OwnerAddress}, Points: 0, TotalGain: ${user.TotalGain + user.GainAmount}, LastGain: ${user.GainAmount}`).join('; ');
          console.log('All users updated successfully.');
          WebApp.showAlert(`Transaction successful for ${userArray.length} users. Details: ${transactionDetails}`);
        }
      } catch (error) {
        console.error('Error sending transaction:', error);
        WebApp.showAlert(`Error sending transaction: ${error}`);
      }

    } catch (error) {
      console.error('Error processing user points:', error);
      WebApp.showAlert(`Error processing user points: ${error}`);
    }

    // Fetch updated data
    await fetchData();
  }





  async function PaybackOnProhand() {
    try {
      // Fetch users with ProID not null or empty and ProPoint greater than 1000, limited to 3 users
      const { data: users, error: fetchError } = await supabase
        .from('Usertbl')
        .select('OwnerAddress, ProID, ProPoint, TonAddress, ProGain')
        .not('ProID', 'is', null)
        .not('ProID', 'eq', '')
        .gt('ProPoint', 1000)
        .limit(3);

      if (fetchError) {
        throw new Error(`Error fetching users: ${fetchError.message}`);
      }

      if (users.length === 0) {
        console.log('No users with ProPoint greater than 1000 found.');
        WebApp.showAlert('No users with ProPoint greater than 1000 found.');
        return;
      }

      // Create user array with necessary details
      const userArray = users.map(user => ({
        OwnerAddress: user.OwnerAddress,
        ProID: user.ProID,
        ProPoint: user.ProPoint,
        TonAddress: user.TonAddress,
        ProGain: user.ProGain
      }));

      // Create the datacell for the current batch
      let datacellBuilder = beginCell()
        .storeUint(3, 32) // Indicates the type of transaction
        .storeUint(userArray.length, 32); // Number of users in the current batch

      // Add each user's address and calculated payment to the datacell
      userArray.forEach(user => {
        const paymentAmount = (user.ProPoint * 1000) * 0.04;
        datacellBuilder
          .storeAddress(Address.parse(user.TonAddress))
          .storeCoins(paymentAmount);
        user.ProGain += paymentAmount; // Update the user's ProGain
        user.ProPoint = 0; // Reset ProPoint to zero
      });

      const datacell = datacellBuilder.endCell();

      try {
        const result = await tonConnectUI.sendTransaction({
          validUntil: Date.now() + 5 * 60 * 1000,
          messages: [
            {
              address: "kQAhnoM01NCNwqmoPvXmGEXXxYsrFDcVTm1tNklQXkU0RuHT",
              amount: "10000000",
              payload: datacell.toBoc().toString("base64"),
            }
          ]
        });

        if (result) {
          // Update ProGain and ProPoint for the current batch of users
          for (const user of userArray) {
            const { error: updateError } = await supabase
              .from('Usertbl')
              .update({ ProGain: user.ProGain, ProPoint: user.ProPoint })
              .eq('OwnerAddress', user.OwnerAddress);

            if (updateError) {
              throw new Error(`Error updating user ${user.OwnerAddress}: ${updateError.message}`);
            }
          }
          console.log('Transaction and ProGain update successful.');
          WebApp.showAlert(`Transaction successful for ${userArray.length} users. Details: ${userArray.map(user => `Owner: ${user.OwnerAddress}, Amount: ${user.ProGain}`).join('; ')}`);
        }
      } catch (error) {
        console.error('Error sending transaction:', error);
        WebApp.showAlert(`Error sending transaction: ${error}`);
      }
    } catch (error) {
      console.error('Error processing user ProPoints:', error);
      WebApp.showAlert(`Error processing user ProPoints: ${error}`);
    }
    await fetchData();
  }



  const handleBuyProduct = async () => {
    if (!user) {
      WebApp.showAlert('You must be logged in to your account.');
      console.error('You Must Log in');
      return;
    }
    if (!logedInUserTonAddress) {
      WebApp.showAlert('You must first connect your wallet to the app.');
      console.error('You Must Connect Your Wallet');
      return;
    }
    if (haverow) {
      WebApp.showAlert('You have already purchased the product.');
      console.error('You have already purchased the product.');
      return;
    }
    const result = await handleCheckReferalisNull();
    if (!result) {
      WebApp.showAlert('Your introducer is not allowed to start a new hand.');
      console.error('Your Upper Has Right Hand And Left Hand.');
      return;
    }
    await handleCerateransaction("20000000")
  };



  const handleGetLoan = async () => {
    if (!user) {
      WebApp.showAlert('You must be logged in to your account.');
      console.error('You Must Log in');
      return;
    }
    if (!logedInUserTonAddress) {
      WebApp.showAlert('You must first connect your wallet to the app.');
      console.error('You Must Connect Your Wallet');
      return;
    }
    if (haverow) {
      WebApp.showAlert('You have already purchased the product.');
      console.error('You have already purchased the product.');
      return;
    }
    const result = await handleCheckReferalisNull();
    if (!result) {
      WebApp.showAlert('Your introducer is not allowed to start a new hand.');
      console.error('Your Upper Has Right Hand And Left Hand.');
      return;
    }
    await handleCerateransaction("10000000")
  };


  const handleCerateransaction = async (price: string) => {
    try {
      const senderJettonWalletAddress = await getSenderJettonWalletAddress(logedInUserTonAddress);
      // console.log(senderJettonWalletAddress)
      let datacellBuilder = beginCell()
      .storeUint(0x0f8a7ea5, 32) // Method ID for "transfer" as per Jetton standard
      .storeUint(0, 64) // Query ID (0 for no specific query)
      .storeCoins(10000) // USDT amount (in smallest units)
      .storeAddress(Address.parse("EQDBAib1_NB3WycBrxyez3hgseTvYiFnsLUMy5jmZjarGi7_")) // Recipient's address
      .storeAddress(Address.parse(senderJettonWalletAddress)) // Sender's address (return address for excess funds or errors)
      .storeBit(0) // Optional payload or comment field (set to 0 if unused)
      .storeCoins(0) 
      .storeBit(0)
      .storeUint(0, 32)
      .storeStringTail("Buy");
    const datacell = datacellBuilder.endCell();
    

      const result = await tonConnectUI.sendTransaction({
        validUntil: Date.now() + 5 * 60 * 1000,
        messages: [
          {
            address: "EQDBAib1_NB3WycBrxyez3hgseTvYiFnsLUMy5jmZjarGi7_",
            amount: "10000000",
            payload: datacell.toBoc().toString("base64"),
          }
        ]
      });
      if (price === "10000000") setBuy10Percent(1000000);
      if (price === "20000000") setBuy10Percent(2000000);

      setTransactionResult(result);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };



  useEffect(() => {
    if (transactionResult !== null) {
      console.log("Transaction Confirmed");
      handleBuyPointForUppers();
    }
  }, [transactionResult]);



  const updateReferalTotalGain = async (ownerAddress: string) => {
    try {
      const { data: referalUserData, error: referalUserError } = await supabase
        .from('Usertbl')
        .select('TotalGain')
        .eq('OwnerAddress', ownerAddress)
        .single();

      if (referalUserError) {
        console.error('Error fetching referal user:', referalUserError);
        return;
      }

      if (referalUserData) {
        const newTotalGain = referalUserData.TotalGain + buy10Percent;

        const { error: updateError } = await supabase
          .from('Usertbl')
          .update({ TotalGain: newTotalGain })
          .eq('OwnerAddress', ownerAddress);

        if (updateError) {
          console.error('Error updating TotalGain:', updateError);
          return;
        }

        console.log(`TotalGain for ${ownerAddress} is now ${newTotalGain}`);
      } else {
        console.error('Referal user not found');
      }
    } catch (error) {
      console.error('Error in updateReferalTotalGain:', error);
    }
  };




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
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
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
        .from('Usertbl')
        .select('id, RightPoint, LeftPoint');
      if (fetchError) {
        throw new Error(`Error fetching users: ${fetchError.message}`);
      }
      // Iterate over each user and update points
      for (const user of users) {
        const { id, RightPoint, LeftPoint } = user;
        const minPoint = Math.min(RightPoint, LeftPoint);
        // Update the user's points
        const { error: updateError } = await supabase
          .from('Usertbl')
          .update({
            Points: minPoint,
            RightPoint: 0,
            LeftPoint: 0
          })
          .eq('id', id);
        if (updateError) {
          console.error(`Error updating user with id ${id}: ${updateError.message}`);
        }
      }
      console.log('Users points updated successfully');
      WebApp.showAlert('Users points updated successfully');
    } catch (error) {
      console.error('Error updating users points:', error);
    }
    await fetchData();
  }


  const handleCheckReferalisNull = async () => {
    // Fetch ReferalAddress, OwnerAddress, RightID, LeftID, TotalGain, and ProID in a single query
    const { data: userData, error: fetchError } = await supabase
      .from('Usertbl')
      .select('OwnerAddress, RightID, LeftID, TotalGain, ProID')
      .eq('id', referal_ID_FromURL)
      .single();
    if (fetchError) {
      console.error('Error fetching data:', fetchError);
      WebApp.showAlert('Ensure that you are using a correct link to access the application.');
      return;
    }
    const { OwnerAddress, RightID, LeftID, TotalGain, ProID } = userData;
    if (RightID && RightID !== '' && LeftID && LeftID !== '') {
      if (TotalGain >= 20000000000000) {
        console.log('RightID and LeftID have values, TotalGain is sufficient:', { RightID, LeftID, TotalGain, ProID });
        // WebApp.showAlert('RightID and LeftID have values, TotalGain is sufficient: ' + JSON.stringify({ RightID, LeftID, TotalGain, ProID }));
        return userData;
      } else {
        console.log('RightID and LeftID have values, but TotalGain is insufficient:', { RightID, LeftID, TotalGain });
        WebApp.showAlert('Your introducer is not allowed to start new hand. ask help from your mentor.');
        return;
      }
    }
    // Return userData if one of RightID or LeftID is null or empty
    return { OwnerAddress, RightID, LeftID, TotalGain, ProID };
  };



  const handleCreateNewRowInUserstbl = async () => {
    try {
      // Run handleCheckReferalisNull and get its return values
      const result = await handleCheckReferalisNull();
      if (!result) return; // If result is undefined (RightID and LeftID are not null or empty), exit the function
      const { OwnerAddress, RightID, LeftID, TotalGain, ProID } = result;
      // Insert new row for new user
      const { error: insertError } = await supabase
        .from('Usertbl')
        .insert([{ OwnerAddress: user!.email, ReferalAddress: OwnerAddress, TonAddress: logedInUserTonAddress }]);
      if (insertError) {
        console.error('Error creating row:', insertError);
        return;
      } else {
        console.log('Row created successfully');
        setHaverow(true);
      }
      // Update RightID or LeftID
      if (!RightID || RightID === '') {
        // If RightID is null or empty, update it with the logged-in user's email
        const { error: updateError } = await supabase
          .from('Usertbl')
          .update({ RightID: user!.email })
          .eq('id', referal_ID_FromURL);
        if (updateError) {
          console.error('Error updating RightID:', updateError);
        } else {
          console.log('RightID updated to', user!.email);
        }
      } else if (!LeftID || LeftID === '') {
        // If RightID is not null or empty but LeftID is null or empty, update LeftID with the logged-in user's email
        const { error: updateError } = await supabase
          .from('Usertbl')
          .update({ LeftID: user!.email })
          .eq('id', referal_ID_FromURL);
        if (updateError) {
          console.error('Error updating LeftID:', updateError);
        } else {
          console.log('LeftID updated to', user!.email);
        }
      } else if (TotalGain >= 20000000000000 && (!ProID || ProID === '')) {
        // If both RightID and LeftID have values, TotalGain is greater than or equal to 20000, and ProID is null or empty, update ProID with the logged-in user's email
        const { error: updateError } = await supabase
          .from('Usertbl')
          .update({ ProID: user!.email })
          .eq('id', referal_ID_FromURL);
        if (updateError) {
          console.error('Error updating ProID:', updateError);
        } else {
          console.log('ProID updated to', user!.email);
        }
      } else {
        // If neither RightID nor LeftID is null or empty, and TotalGain is less than 20000, log their values
        console.log('NOTHING UPDATED , Your Upper Is Not Allowed Te Start New Hand ', { RightID, LeftID });
        WebApp.showAlert('NOTHING UPDATED , Your Upper Is Not Allowed Te Start New Hand ');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };


  const updateFullPayStatus = async (email : string) => {
    const { error } = await supabase
      .from('Usertbl')
      .update({ FullPay: true })
      .eq('OwnerAddress', email);
  
    if (error) {
      console.error('Error updating FullPay status:', error);
    } else {
      console.log(`FullPay status updated successfully for ${email}`);
    }
  };
  


  const handleBuyPointForUppers = async () => {
    await handleCreateNewRowInUserstbl();
    let ownerAddress: string | null = logedInUserEmail;
    let referalAddress: string | null;

    // Fetch the initial referalAddress
    const { data: referalData, error: referalError } = await supabase
      .from('Usertbl')
      .select('ReferalAddress')
      .eq('OwnerAddress', ownerAddress)
      .single();

    if (referalError) {
      console.error('Error fetching ReferalAddress:', referalError);
      return;
    }

    referalAddress = referalData?.ReferalAddress || null;

    // Store the direct referalAddress for updating TotalGain later
    const directReferalAddress: string | null = referalAddress;

    // Loop through the referral chain to update points
    while (referalAddress) {
      const { data, error } = await supabase
        .from('Usertbl')
        .select(
          'RightPoint, RightID, LeftPoint, LeftID, ProPoint, ProID, ReferalAddress, OwnerAddress'
        )
        .eq('OwnerAddress', referalAddress)
        .single();

      if (error) {
        console.error('Error fetching data:', error);
        return;
      }

      if (!data) {
        console.error(`User with OwnerAddress ${referalAddress} not found.`);
        return;
      }

      const currentRightPoint: number = data.RightPoint;
      const currentLeftPoint: number = data.LeftPoint;
      const currentProPoint: number = data.ProPoint;
      const rightID: string = data.RightID;
      const leftID: string = data.LeftID;
      const proID: string = data.ProID;
      const nextReferalAddress: string | null = data.ReferalAddress;
      const nextOwnerAddress: string = data.OwnerAddress;

      let futureRightPoint = currentRightPoint;
      let futureLeftPoint = currentLeftPoint;
      let futureProPoint = currentProPoint;

      if (ownerAddress === rightID) {
        futureRightPoint = currentRightPoint + 1;
      }
      if (ownerAddress === leftID) {
        futureLeftPoint = currentLeftPoint + 1;
      }
      if (ownerAddress === proID) {
        futureProPoint = currentProPoint + 1;
      }

      const { error: updateError } = await supabase
        .from('Usertbl')
        .update({
          RightPoint: futureRightPoint,
          LeftPoint: futureLeftPoint,
          ProPoint: futureProPoint,
        })
        .eq('OwnerAddress', referalAddress);

      if (updateError) {
        console.error('Error updating points:', updateError);
        return;
      } else {
        console.log(`Points for ${referalAddress} updated successfully`);
      }

      referalAddress = nextReferalAddress;
      ownerAddress = nextOwnerAddress;
    }

    // After the loop, update the TotalGain of the direct referral
    if (directReferalAddress) {
      await updateReferalTotalGain(directReferalAddress);
    } else {
      console.error('Direct referalAddress is null.');
    }

    // Update FullPay status if buy10Percent is 2000000
  if (buy10Percent === 2000000) {
    await updateFullPayStatus(logedInUserEmail);
  }

    await fetchData();
  };




  useEffect(() => {
    if (logedInUserEmail === 'Guest') return;
    fetchData();
  }, [logedInUserEmail]);

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('Usertbl')
      .select()
      .eq('OwnerAddress', logedInUserEmail)
      .single(); // Fetch a single row where OwnerAddress matches logedInUserEmail

    if (error) {
      console.error('Error fetching data:', error);
      setHaverow(false);
    } else {
      // console.log('Fetched data:', data);
      setTableData([data]); // Set the single row data into an array to be compatible with setTableData
      setHaverow(!!data);
      console.log("logedInUserEmail is " + logedInUserEmail);
      console.log("have row is " + !!data);
    }
  };





  interface HoneyUserData {
    OwnerAddress: string;
    LeftID?: string;
    RightID?: string;
    TotalGain: number;
    // Add other relevant fields as needed
  }



  // Function to check if LeftID and RightID are present
  const checkAndSetHonyLogo = (data: HoneyUserData) => {
    if (data.LeftID && data.RightID) {
      setHonyLogo("stage");
    }
  };

  // Effect to call checkAndSetHonyLogo when tableData changes
  useEffect(() => {
    if (tableData.length > 0) {
      checkAndSetHonyLogo(tableData[0]);
    }
  }, [tableData]);











  interface UserFromDatabase {
    id: number; // 'int8' translates to 'number' in TypeScript
    OwnerAddress: string;
    RightID: string | null; // These are actually OwnerAddress
    LeftID: string | null; // These are actually OwnerAddress
  }

  const generateInvertedHierarchyList = async (logedInUserEmail: string): Promise<string[]> => {
    const userHierarchy: string[] = [];
    const addressToIdMap = new Map<string, number>();

    // Fetch all user data initially
    const { data: allUserData, error: allUserError } = await supabase
      .from('Usertbl')
      .select('id, OwnerAddress, RightID, LeftID');

    if (allUserError) {
      console.error('Error fetching all user data:', allUserError);
      return userHierarchy;
    }

    // Populate the address to id map
    allUserData.forEach((user: UserFromDatabase) => {
      addressToIdMap.set(user.OwnerAddress, user.id);
    });

    let usersToProcess: { email: string, position: string }[] = [{ email: logedInUserEmail, position: 'My ID' }];

    while (usersToProcess.length > 0) {
      const currentUser = usersToProcess.shift();

      if (currentUser) {
        // Find current user data from the map
        const currentUserId = addressToIdMap.get(currentUser.email);
        if (!currentUserId) {
          console.warn(`No id found for user ${currentUser.email}`);
          continue;
        }

        const currentUserData = allUserData.find((user: UserFromDatabase) => user.OwnerAddress === currentUser.email);

        if (!currentUserData) {
          console.warn(`No data found for user ${currentUser.email}`);
          continue;
        }

        // Add current user with position and id to the hierarchy list
        userHierarchy.push(`${currentUser.position} is ( ${currentUserId} )`);

        // Add RightID and LeftID to the hierarchy list and the users to process
        if (currentUserData.RightID) {
          const rightUserId = addressToIdMap.get(currentUserData.RightID);
          if (rightUserId) {
            // userHierarchy.push(`rightID of ${currentUserId} is user with id ${rightUserId}`);
            usersToProcess.push({ email: currentUserData.RightID, position: `Begin Hand of ${currentUserId}` });
          }
        }

        if (currentUserData.LeftID) {
          const leftUserId = addressToIdMap.get(currentUserData.LeftID);
          if (leftUserId) {
            // userHierarchy.push(`leftID of ${currentUserId} is user with id ${leftUserId}`);
            usersToProcess.push({ email: currentUserData.LeftID, position: `Balance Hand of ${currentUserId}` });
          }
        }
      }
    }

    return userHierarchy;
  };







  const handleGenerateList = async () => {
    const hierarchyList = await generateInvertedHierarchyList(logedInUserEmail);
    setUserHierarchy(hierarchyList);
    setPageN(4);
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
            {/* {user && (
              <button onClick={handleSignOut} className="logout-button">Logout</button>
            )} */}
          </div>
        </div>
        <nav className="menu">
          <ul>
            <li key={0}><button onClick={() => setPageN(5)}>Products</button></li>
            <li key={1}><button onClick={() => setPageN(0)}>Home</button></li>
            {/* <li key={5}><button onClick={() => setPageN(3)}>admin</button></li> */}
            <li key={2}><button onClick={() => setPageN(6)}>Hybrid Plan</button></li>
            {/* <li key={2}><button onClick={() => setPageN(3)}>Admin</button></li> */}
          </ul>
        </nav>
      </div>
      <div className="down-section">
        {page_n === 0 && (
          <div>
            {user ? (
              <div>
                <div>
                  {haverow ? (
                    <div>
                      <ul className="info-card-list">
                        {tableData.map((row) => (
                          <li key={row.id}>
                            <div className="info-card-container">
                              <div className="info-card-new">
                                <div className="info-details">
                                  <div className="info-part-new"><strong>Welcome</strong> </div>
                                  <div className="info-part-new">{row.OwnerAddress}</div>
                                  <div className="info-part-new"><strong>Level:</strong> {HonyLogo}</div>
                                </div>
                                <img src={`./${HonyLogo}.JPG`} alt="Start Level" className="logo" />
                                <div className="info-icon" onClick={handleSignOut}>
                                  <FontAwesomeIcon icon={faSignOut} className="members-icon-new" size="2x" />
                                </div>
                              </div>

                              {row.LeftID ? (
                                <div className="info-card-new">
                                  <div className="info-details">
                                    <div className="info-part-new"><strong>Begin Hand</strong> </div>
                                    <div className="info-part-new"><strong>Direct:</strong> {row.LeftID}</div>
                                    <div className="info-part-new"><strong>This Week Buys:</strong> {row.LeftPoint}</div>
                                  </div>
                                  <div className="info-icon">
                                    <FontAwesomeIcon icon={faUsers} className="members-icon-new" size="2x" onClick={handleGenerateList} />
                                  </div>
                                </div>
                              ) : (
                                <div className="info-card">
                                  <div className="info-part"><strong>Begin Hand:</strong> </div>
                                  <div className="info-part" style={{ textAlign: 'right' }}>NotActivated</div>
                                </div>
                              )}

                              {row.RightID ? (
                                <div className="info-card-new">
                                  <div className="info-details">
                                    <div className="info-part-new"><strong>Balance Hand</strong> </div>
                                    <div className="info-part-new"><strong>Direct:</strong> {row.RightID}</div>
                                    <div className="info-part-new"><strong>This Week Buys:</strong> {row.RightPoint}</div>
                                  </div>
                                  <div className="info-icon">
                                    <FontAwesomeIcon icon={faUsers} className="members-icon-new" size="2x" onClick={handleGenerateList} />
                                  </div>
                                </div>
                              ) : (
                                <div className="info-card">
                                  <div className="info-part"><strong>Balance Hand:</strong></div>
                                  <div className="info-part" style={{ textAlign: 'right' }}>NotActivated</div>
                                </div>
                              )}

                              {row.ProID && (
                                <div className="info-card-new">
                                  <div className="info-details">
                                    <div className="info-part-new"><strong>Pro Hand</strong> </div>
                                    <div className="info-part-new"><strong>Direct:</strong> {row.ProID}</div>
                                    <div className="info-part-new"><strong>This Week Buys:</strong> {row.ProPoint}</div>
                                  </div>
                                  <div className="info-icon">
                                    <FontAwesomeIcon icon={faUsers} className="members-icon-new" size="2x" onClick={() => handleGenerateList} />
                                  </div>
                                </div>
                              )}
                              <div className="info-card">
                                <div className="info-part"><strong>Weekly Points:</strong></div>
                                <div className="info-part" style={{ textAlign: 'right' }}>{Math.min(row.LeftPoint, row.RightPoint)}</div>
                              </div>
                              <div className="info-card">
                                <div className="info-part"><strong>Last Week Rewards:</strong></div>
                                <div className="info-part" style={{ textAlign: 'right' }}>{row.LastGain / 1000000000} TON</div>
                              </div>
                              <div className="info-card">
                                <div className="info-part"><strong>Total Rewards:</strong></div>
                                <div className="info-part" style={{ textAlign: 'right' }}>{row.TotalGain / 1000000000} TON</div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div>
                        <div className="button-container">
                          <div className="buy-row" style={{ border: 'none' }}>
                            <div className="button-row">
                              <button className="action-button" onClick={handleShare}>Share Referal</button>
                              <button className="action-button" onClick={() => window.open('https://t.me/Saeidzng', '_blank')}>Support</button>

                            </div>
                          </div>
                        </div>

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
                    </div>
                  ) : (

                    <div  >
                      <div>
                        <div className="welcome-name">
                        <div className="info"><strong>Welcome</strong> {welcomeDisplayName}</div>
                        </div>
                        <div className="button-container">
                          <div className="button-row-single">
                            <div className="info-icon" onClick={handleSignOut}>
                              <FontAwesomeIcon icon={faSignOut} className="members-icon-new" size="2x" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="button-container">
                        <div className="buy-row">
                          <div className="button-row">
                            <button className="action-button" style={{ marginTop: '40px' }} onClick={handleGetLoan}>Get Loan</button>
                            <button className="action-button" style={{ marginTop: '40px' }} onClick={handleBuyProduct}>Buy Product</button>
                          </div>
                        </div>
                      </div>
                    </div>


                  )}
                </div>

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
              <div>
                <label>Confirm Password:</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="error-message">{error}</p>}
              <button type="submit">Sign Up</button>
            </form>
            <p>
              Already have an account?
              <a href="#login" onClick={() => setPageN(1)}> Login</a>
            </p>
          </div>
        )}


        {page_n === 3 && (
          <div>
            <label>Share_rate = {shareRate}</label><br />
            <label>Your Upper = {referal_Email_FromURL}</label><br />
            <button className="action-button" onClick={updateUsersPoints}>1-Calculate real Points</button><br />
            <button className="action-button" onClick={updateShareRateInMaster}>2-Update share rate in master</button><br />
            <button className="action-button" onClick={handleSendPaybackOrder}>3-Payback</button><br />
            <button className="action-button" onClick={PaybackOnProhand}>3-Payback Pro Hand</button><br />
          </div>
        )}

        {page_n === 4 && (
          <div className="app-container">
            <div className="list-container">
              {userHierarchy.length > 0 && (
                <ul className="hierarchy-list">
                  {userHierarchy.map((user, index) => (
                    <li key={index} className="hierarchy-item">{user}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default App;
