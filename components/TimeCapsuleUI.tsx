"use client";
import React, { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useWriteContract, useReadContract, useSwitchChain, useChainId } from "wagmi";
import { injected } from "wagmi/connectors";
import { parseEther, formatEther } from "viem";

// ✅ آدرس قرارداد شما (ثابت)
const CONTRACT_ADDRESS = "0x2f20592FCCD813900cE38a841d17c5A4978B158b";

const TimeCapsuleUI = () => {
    const { address, isConnected } = useAccount();
    const { connect } = useConnect();
    const { disconnect } = useDisconnect();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();
    const { writeContract, isPending } = useWriteContract();

    const [mounted, setMounted] = useState(false);
    const [amount, setAmount] = useState("");
    const [beneficiary, setBeneficiary] = useState("");

    // متغیرهای زمان
    const [duration, setDuration] = useState("60");
    const [customDays, setCustomDays] = useState("");

    useEffect(() => setMounted(true), []);

    // 1. READ LOCKS
    const { data: locksData, refetch: refetchLock } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: [
            {
                name: "getUserLocks",
                type: "function",
                stateMutability: "view",
                inputs: [{ name: "user", type: "address" }],
                outputs: [{
                    components: [
                        { name: "amount", type: "uint256" },
                        { name: "unlockTime", type: "uint256" },
                        { name: "sender", type: "address" },
                        { name: "withdrawn", type: "bool" }
                    ],
                    name: "",
                    type: "tuple[]"
                }]
            },
            { name: "lock", type: "function", stateMutability: "payable", inputs: [{ type: "uint256" }, { type: "address" }], outputs: [] },
            { name: "withdraw", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] }
        ],
        functionName: "getUserLocks",
        args: address ? [address] : undefined,
        query: {
            refetchInterval: 2000,
            enabled: !!address,
        }
    });

    // 2. CALCULATE STATUS
    const [lockedAmount, setLockedAmount] = useState(0n);
    const [statusText, setStatusText] = useState("Loading...");
    const [canWithdraw, setCanWithdraw] = useState(false);

    useEffect(() => {
        if (locksData && Array.isArray(locksData)) {
            let total = 0n;
            let hasUnlockable = false;
            let nextUnlock = 0n;
            const now = Math.floor(Date.now() / 1000);

            for (const lock of locksData) {
                if (!lock.withdrawn && lock.amount > 0n) {
                    total += BigInt(lock.amount);
                    if (now >= Number(lock.unlockTime)) {
                        hasUnlockable = true;
                    } else {
                        if (nextUnlock === 0n || lock.unlockTime < nextUnlock) {
                            nextUnlock = lock.unlockTime;
                        }
                    }
                }
            }
            setLockedAmount(total);
            setCanWithdraw(hasUnlockable);

            if (hasUnlockable) {
                setStatusText("✅ Funds Ready to Withdraw");
            } else if (nextUnlock > 0n && total > 0n) {
                const diff = Number(nextUnlock) - now;
                setStatusText(`⏳ Next Unlock: ${Math.floor(diff / 60)}m ${diff % 60}s`);
            } else {
                setStatusText(total > 0n ? "🔒 All Assets Locked" : "✨ No Active Locks");
            }
        } else {
            setLockedAmount(0n);
            setStatusText("✨ No Active Locks");
        }
    }, [locksData]);

    // ✅ اصلاح شده: منطق هندل کردن قفل
    const handleLock = () => {
        let finalDuration = 0n;

        // اول چک میکنیم آیا حالت سفارشی انتخاب شده؟
        if (duration === "custom") {
            if (!customDays || Number(customDays) <= 0) {
                alert("Please enter a valid number of days.");
                return;
            }
            // تبدیل روز به ثانیه (Days * 86400)
            finalDuration = BigInt(customDays) * 86400n;
        } else {
            // اگر سفارشی نبود، همان عدد پیش‌فرض (60 یا 3600 و...) استفاده شود
            finalDuration = BigInt(duration);
        }

        writeContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: [
                { name: "lock", inputs: [{ type: "uint256" }, { type: "address" }], outputs: [], type: "function", stateMutability: "payable" }
            ],
            functionName: "lock",
            args: [finalDuration, beneficiary as `0x${string}`],
            value: parseEther(amount || "0"),
        }, {
            onSuccess: () => {
                alert("Lock Created Successfully!");
                setAmount("");
                setCustomDays("");
                setTimeout(() => refetchLock(), 1000);
            },
            onError: (error) => {
                console.error("Lock failed:", error);
                alert("Transaction Failed. Check console for details.");
            }
        });
    };

    const handleWithdraw = () => {
        writeContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: [
                { name: "withdraw", inputs: [], outputs: [], type: "function", stateMutability: "nonpayable" }
            ],
            functionName: "withdraw",
            args: [],
        }, {
            onSuccess: () => {
                alert("Withdrawn Successfully!");
                setTimeout(() => refetchLock(), 1000);
            },
            onError: (error) => {
                console.error("Withdraw failed:", error);
                alert("Withdraw Failed. Check console for details.");
            }
        });
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b border-neutral-800">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">TimeCapsule V2</h1>
                    {!isConnected ? (
                        <button onClick={() => connect({ connector: injected() })} className="bg-white text-black px-4 py-2 rounded-full font-bold hover:scale-105 transition">Connect Wallet</button>
                    ) : (
                        <button onClick={() => disconnect()} className="text-red-400 text-xs hover:text-red-300">Disconnect {address?.slice(0, 6)}...</button>
                    )}
                </div>

                {/* Intro Section */}
                <div className="bg-neutral-800/30 border border-neutral-700/50 rounded-xl p-5 mb-2 text-left">
                    <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        How it Works? 🤔
                    </h2>
                    <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside marker:text-purple-500">
                        <li><strong className="text-gray-200">Lock:</strong> Deposit USDC into the smart contract.</li>
                        <li><strong className="text-gray-200">Designate:</strong> Set yourself or a friend as the beneficiary.</li>
                        <li><strong className="text-gray-200">Wait:</strong> Assets remain frozen on-chain until the unlock time.</li>
                        <li><strong className="text-gray-200">Withdraw:</strong> Claim 100% of the funds once the time is up.</li>
                    </ul>
                </div>

                {isConnected && chainId === 5042002 ? (
                    <>
                        <div className="text-center p-6 bg-neutral-800/50 rounded-xl border border-white/5">
                            <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Total Vault Value</p>
                            <div className="text-4xl font-bold text-white mb-3">{formatEther(lockedAmount)} USDC</div>
                            <div className={`inline-block px-4 py-1.5 rounded-full text-xs font-mono border ${canWithdraw ? "bg-green-900/30 border-green-500/30 text-green-400" : "bg-purple-900/30 border-purple-500/30 text-purple-300"}`}>
                                {statusText}
                            </div>
                        </div>

                        {canWithdraw ? (
                            <button onClick={handleWithdraw} disabled={isPending} className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-green-900/20 hover:scale-[1.02] transition">
                                {isPending ? "Processing..." : "🔓 Withdraw Available Funds"}
                            </button>
                        ) : (
                            <div className="space-y-4 pt-2">
                                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount (USDC)" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white focus:border-purple-500 outline-none transition" />
                                <input type="text" value={beneficiary} onChange={e => setBeneficiary(e.target.value)} placeholder="Beneficiary (0x...)" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white focus:border-purple-500 outline-none transition font-mono text-sm" />

                                {/* SELECT BOX */}
                                <select value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white focus:border-purple-500 outline-none transition cursor-pointer">
                                    <option value="60">1 Minute (Test)</option>
                                    <option value="3600">1 Hour</option>
                                    <option value="86400">1 Day</option>
                                    <option value="custom">Custom (Days)</option>
                                </select>

                                {/* CUSTOM INPUT FIELD */}
                                {duration === "custom" && (
                                    <input
                                        type="number"
                                        value={customDays}
                                        onChange={e => setCustomDays(e.target.value)}
                                        placeholder="Enter number of days (e.g. 30)"
                                        className="w-full bg-neutral-900 border border-purple-500/50 rounded-xl p-4 text-white focus:border-purple-500 outline-none transition animate-in fade-in slide-in-from-top-2"
                                    />
                                )}

                                <button onClick={handleLock} disabled={isPending || !amount || !beneficiary || (duration === 'custom' && !customDays)} className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-purple-900/20 hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isPending ? "Creating Lock..." : "🔒 Lock Assets"}
                                </button>
                            </div>
                        )}
                    </>
                ) : (isConnected && <button onClick={() => switchChain({ chainId: 5042002 })} className="w-full bg-red-600/20 border border-red-500/50 text-red-200 py-3 rounded-xl font-bold hover:bg-red-600/30 transition">Wrong Network - Switch to Arc</button>)}
            </div>
        </div>
    );
};
export default TimeCapsuleUI;