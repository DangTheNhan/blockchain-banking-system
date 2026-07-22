import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, ABIS } from './constants';
import './index.css';

interface SavingPlan {
  id: number;
  apr: number;
  penalty: number;
  tenor: number;
  enabled: boolean;
}

interface UserDeposit {
  tokenId: number;
  planId: number;
  amount: string;
  apr: number;
  penalty: number;
  startTime: number;
  maturityTime: number;
}

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [plans, setPlans] = useState<SavingPlan[]>([]);
  const [userDeposits, setUserDeposits] = useState<UserDeposit[]>([]);
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(Math.floor(Date.now() / 1000));
  const [timeOffset, setTimeOffset] = useState<number>(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000) + timeOffset);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeOffset]);

  useEffect(() => {
    if (window.ethereum) {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);
      
      web3Provider.listAccounts().then((accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0].address);
          loadData(web3Provider, accounts[0].address);
        }
      });

      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          if (provider) loadData(provider, accounts[0]);
        } else {
          setAccount(null);
          setBalance("0");
          setUserDeposits([]);
        }
      });
    }
  }, []);

  const loadData = async (web3Provider: ethers.BrowserProvider, userAddress: string) => {
    try {
      // Load USDC Balance
      const usdcContract = new ethers.Contract(CONTRACT_ADDRESSES.MockUSDC, ABIS.MockUSDC, web3Provider);
      const bal = await usdcContract.balanceOf(userAddress);
      setBalance(ethers.formatUnits(bal, 6));

      // Get block time offset
      const blockNumber = await web3Provider.getBlockNumber();
      const block = await web3Provider.getBlock(blockNumber);
      if (block) {
        setTimeOffset(block.timestamp - Math.floor(Date.now() / 1000));
        setCurrentTime(block.timestamp);
      }

      // Load Plans
      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.SavingCore, ABIS.SavingCore, web3Provider);
      const nextPlanId = await coreContract.nextPlanId();
      
      const loadedPlans: SavingPlan[] = [];
      for (let i = 1; i < Number(nextPlanId); i++) {
        const plan = await coreContract.plans(i);
        loadedPlans.push({
          id: i,
          apr: Number(plan.apr),
          penalty: Number(plan.penalty),
          tenor: Number(plan.tenor),
          enabled: plan.enabled
        });
      }
      setPlans(loadedPlans);

      // Load User Deposits
      const nextTokenId = await coreContract.nextTokenId();
      const loadedDeposits: UserDeposit[] = [];
      
      for (let i = 1; i < Number(nextTokenId); i++) {
        try {
          // If token is burned (withdrawn), ownerOf will revert. We catch it and skip.
          const owner = await coreContract.ownerOf(i);
          if (owner.toLowerCase() === userAddress.toLowerCase()) {
            const dep = await coreContract.deposits(i);
            loadedDeposits.push({
              tokenId: i,
              planId: Number(dep.planId),
              amount: ethers.formatUnits(dep.amount, 6),
              apr: Number(dep.apr),
              penalty: Number(dep.penalty),
              startTime: Number(dep.startTime),
              maturityTime: Number(dep.maturityTime)
            });
          }
        } catch (e) {
          // Token burned, ignore
        }
      }
      setUserDeposits(loadedDeposits);
    } catch (err) {
      console.error("Failed to load data:", err);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      if (provider) loadData(provider, accounts[0]);
    } catch (error) {
      console.error("User rejected connection", error);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setBalance("0");
    setUserDeposits([]);
  };

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const mintUSDC = async () => {
    if (!provider || !account) return;
    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const usdcContract = new ethers.Contract(CONTRACT_ADDRESSES.MockUSDC, ABIS.MockUSDC, signer);
      
      const tx = await usdcContract.mint(account, ethers.parseUnits("1000", 6));
      await tx.wait();
      
      alert("Successfully minted 1,000 mUSDC!");
      loadData(provider, account);
    } catch (err) {
      console.error("Mint failed:", err);
      alert("Mint failed. See console.");
    }
    setLoading(false);
  };

  const handleDeposit = async () => {
    if (!provider || !account) return;
    if (!depositAmount || Number(depositAmount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const usdcContract = new ethers.Contract(CONTRACT_ADDRESSES.MockUSDC, ABIS.MockUSDC, signer);
      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.SavingCore, ABIS.SavingCore, signer);
      const parsedAmount = ethers.parseUnits(depositAmount, 6);

      const approveTx = await usdcContract.approve(CONTRACT_ADDRESSES.SavingCore, parsedAmount);
      await approveTx.wait();

      const depositTx = await coreContract.openDeposit(selectedPlanId, parsedAmount);
      await depositTx.wait();

      alert(`Successfully deposited ${depositAmount} mUSDC!`);
      setDepositAmount("");
      loadData(provider, account);
    } catch (err) {
      console.error("Deposit failed:", err);
      alert("Deposit failed. Check console for details.");
    }
    setLoading(false);
  };

  const handleAction = async (action: 'withdraw' | 'earlyWithdraw' | 'renew', tokenId: number) => {
    if (!provider || !account) return;
    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.SavingCore, ABIS.SavingCore, signer);
      
      let tx;
      if (action === 'withdraw') {
        tx = await coreContract.withdrawAtMaturity(tokenId);
      } else if (action === 'earlyWithdraw') {
        const confirmEarly = window.confirm("You will lose all interest and pay a penalty. Proceed?");
        if (!confirmEarly) { setLoading(false); return; }
        tx = await coreContract.earlyWithdraw(tokenId);
      } else if (action === 'renew') {
        tx = await coreContract.renewDeposit(tokenId);
      }
      
      await tx.wait();
      alert(`Action '${action}' successful for Token ID ${tokenId}!`);
      loadData(provider, account);
    } catch (err) {
      console.error(`Action ${action} failed:`, err);
      alert(`${action} failed. Check console.`);
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <header className="header">
        <div className="logo">
          🏦 Decentralized Savings
        </div>
        <div>
          {account ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                {Number(balance).toLocaleString()} mUSDC
              </span>
              <div className="wallet-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🟢 {formatAddress(account)}
                <button 
                  onClick={disconnectWallet}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    marginLeft: '0.5rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                  title="Disconnect"
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={connectWallet}>
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      <main>
        {!account ? (
          <section className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Welcome to the Future of Banking</h1>
            <p style={{ fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
              Securely deposit your digital assets, earn automated interest with full transparency, and manage your savings plans directly on-chain.
            </p>
            <button className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.2rem' }} onClick={connectWallet}>
              Get Started Now
            </button>
          </section>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2>Available Saving Plans</h2>
              <button className="btn btn-outline" onClick={mintUSDC} disabled={loading}>
                {loading ? "Processing..." : "🚰 Mint 1,000 mUSDC"}
              </button>
            </div>

            <div className="grid">
              {/* Plans List */}
              <div className="glass-card">
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary-hover)' }}>System Plans</h3>
                {plans.length === 0 ? (
                  <p>No plans available.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {plans.map(plan => (
                      <div 
                        key={plan.id} 
                        style={{ 
                          padding: '1rem', 
                          border: `2px solid ${selectedPlanId === plan.id ? 'var(--primary)' : 'var(--border-color)'}`,
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onClick={() => setSelectedPlanId(plan.id)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <strong>Plan #{plan.id}</strong>
                          <span style={{ color: plan.enabled ? 'var(--primary)' : 'red' }}>
                            {plan.enabled ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                          <span>APR: {(plan.apr / 100).toFixed(2)}%</span>
                          <span>Penalty: {(plan.penalty / 100).toFixed(2)}%</span>
                          <span>Tenor: {plan.tenor / 86400} Days</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Deposit Form */}
              <div className="glass-card">
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary-hover)' }}>Open a Deposit</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Amount (mUSDC)</label>
                    <input 
                      type="number" 
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Enter amount..."
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                  
                  <div style={{ background: 'var(--secondary)', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                    <p style={{ marginBottom: '0.5rem' }}><strong>Selected Plan:</strong> #{selectedPlanId}</p>
                    <p style={{ marginBottom: '0.5rem' }}><strong>APR:</strong> {plans.find(p => p.id === selectedPlanId)?.apr ? (plans.find(p => p.id === selectedPlanId)!.apr / 100).toFixed(2) : 0}%</p>
                    <p><strong>Lock-in Period:</strong> {plans.find(p => p.id === selectedPlanId)?.tenor ? (plans.find(p => p.id === selectedPlanId)!.tenor / 86400) : 0} Days</p>
                  </div>

                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', marginTop: '1rem' }} 
                    onClick={handleDeposit}
                    disabled={loading || plans.length === 0}
                  >
                    {loading ? "Processing..." : "Deposit Now"}
                  </button>
                </div>
              </div>
            </div>

            {/* User Deposits Dashboard */}
            <div style={{ marginTop: '3rem' }}>
              <h2 style={{ marginBottom: '1.5rem' }}>My Active Deposits</h2>
              {userDeposits.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                  <p>You don't have any active deposits yet.</p>
                </div>
              ) : (
                <div className="grid">
                  {userDeposits.map(dep => {
                    const isMatured = currentTime >= dep.maturityTime;
                    const timeLeft = Math.max(0, dep.maturityTime - currentTime);
                    const daysLeft = Math.floor(timeLeft / 86400);
                    const hoursLeft = Math.floor((timeLeft % 86400) / 3600);

                    return (
                      <div key={dep.tokenId} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ color: 'var(--text-main)' }}>Deposit #{dep.tokenId}</h4>
                          <span style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px', 
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            backgroundColor: isMatured ? 'var(--primary)' : '#f59e0b',
                            color: 'white'
                          }}>
                            {isMatured ? 'Matured' : 'Locked'}
                          </span>
                        </div>
                        
                        <div style={{ fontSize: '0.95rem' }}>
                          <p><strong>Principal:</strong> {Number(dep.amount).toLocaleString()} mUSDC</p>
                          <p><strong>Fixed APR:</strong> {(dep.apr / 100).toFixed(2)}%</p>
                          <p><strong>Penalty:</strong> {(dep.penalty / 100).toFixed(2)}%</p>
                        </div>
                        
                        <div style={{ background: '#f1f5f9', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center' }}>
                          {isMatured ? (
                            <span style={{ color: 'var(--primary-hover)', fontWeight: 'bold' }}>🎉 Ready to Claim!</span>
                          ) : (
                            <span>Time left: {daysLeft}d {hoursLeft}h</span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                          {isMatured ? (
                            <>
                              <button 
                                className="btn btn-primary" 
                                style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}
                                onClick={() => handleAction('withdraw', dep.tokenId)}
                                disabled={loading}
                              >
                                Withdraw
                              </button>
                              <button 
                                className="btn btn-outline" 
                                style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}
                                onClick={() => handleAction('renew', dep.tokenId)}
                                disabled={loading}
                              >
                                Renew
                              </button>
                            </>
                          ) : (
                            <button 
                              className="btn btn-outline" 
                              style={{ width: '100%', padding: '0.5rem', fontSize: '0.9rem', borderColor: '#ef4444', color: '#ef4444' }}
                              onClick={() => handleAction('earlyWithdraw', dep.tokenId)}
                              disabled={loading}
                            >
                              Early Withdraw
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
