"use client";
import React, { useState, useEffect } from "react";
import { useAccount, useWriteContract, useReadContract, useSwitchChain, useChainId } from "wagmi";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseEther, formatEther } from "viem";
import { Clock, Lock, Unlock, TrendingUp, Calendar, User, ArrowRight } from "lucide-react";

const CONTRACT_ADDRESS = "0x2f20592FCCD813900cE38a841d17c5A4978B158b";

const TimeCapsuleUI = () => {
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();
    const { writeContract, isPending } = useWriteContract();

    const [mounted, setMounted] = useState(false);
    const [amount, setAmount] = useState("");
    const [beneficiary, setBeneficiary] = useState("");
    const [duration, setDuration] = useState("60");
    const [customDays, setCustomDays] = useState("");
    const [activeTab, setActiveTab] = useState<"create" | "locks">("create");

    useEffect(() => setMounted(true), []);

    // READ LOCKS
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

    // CALCULATE STATUS & STATS
    const [stats, setStats] = useState({
        totalLocked: 0n,
        activeLocks: 0,
        readyToWithdraw: 0,
        withdrawnLocks: 0
    });

    useEffect(() => {
        if (locksData && Array.isArray(locksData)) {
            let total = 0n;
            let active = 0;
            let ready = 0;
            let withdrawn = 0;
            const now = Math.floor(Date.now() / 1000);

            for (const lock of locksData) {
                if (lock.withdrawn) {
                    withdrawn++;
                } else {
                    total += BigInt(lock.amount);
                    if (now >= Number(lock.unlockTime)) {
                        ready++;
                    } else {
                        active++;
                    }
                }
            }
            setStats({ totalLocked: total, activeLocks: active, readyToWithdraw: ready, withdrawnLocks: withdrawn });
        }
    }, [locksData]);

    const handleLock = () => {
        let finalDuration = 0n;

        if (duration === "custom") {
            if (!customDays || Number(customDays) <= 0) {
                alert("Please enter a valid number of days.");
                return;
            }
            finalDuration = BigInt(customDays) * 86400n;
        } else {
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
                setBeneficiary("");
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
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
                            TimeCapsule V3
                        </h1>
                        <p className="text-gray-400 text-sm">Lock your assets for the future</p>
                    </div>
                    <ConnectButton />
                </div>

                {isConnected && chainId === 5042002 ? (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-slate-900/50 backdrop-blur border border-purple-500/20 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-purple-500/20 rounded-lg">
                                        <TrendingUp className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <span className="text-gray-400 text-sm">Total Locked</span>
                                </div>
                                <p className="text-2xl font-bold">{formatEther(stats.totalLocked)} USDC</p>
                            </div>

                            <div className="bg-slate-900/50 backdrop-blur border border-blue-500/20 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <Lock className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <span className="text-gray-400 text-sm">Active Locks</span>
                                </div>
                                <p className="text-2xl font-bold">{stats.activeLocks}</p>
                            </div>

                            <div className="bg-slate-900/50 backdrop-blur border border-green-500/20 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-green-500/20 rounded-lg">
                                        <Unlock className="w-5 h-5 text-green-400" />
                                    </div>
                                    <span className="text-gray-400 text-sm">Ready to Withdraw</span>
                                </div>
                                <p className="text-2xl font-bold">{stats.readyToWithdraw}</p>
                            </div>

                            <div className="bg-slate-900/50 backdrop-blur border border-gray-500/20 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-gray-500/20 rounded-lg">
                                        <Calendar className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <span className="text-gray-400 text-sm">Withdrawn</span>
                                </div>
                                <p className="text-2xl font-bold">{stats.withdrawnLocks}</p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 mb-6 bg-slate-900/50 backdrop-blur border border-slate-700/50 rounded-xl p-2">
                            <button
                                onClick={() => setActiveTab("create")}
                                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${activeTab === "create"
                                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/30"
                                    : "text-gray-400 hover:text-white hover:bg-slate-800/50"
                                    }`}
                            >
                                Create Lock
                            </button>
                            <button
                                onClick={() => setActiveTab("locks")}
                                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${activeTab === "locks"
                                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/30"
                                    : "text-gray-400 hover:text-white hover:bg-slate-800/50"
                                    }`}
                            >
                                My Locks ({locksData?.length || 0})
                            </button>
                        </div>

                        {/* Tab Content */}
                        {activeTab === "create" ? (
                            <CreateLockForm
                                amount={amount}
                                setAmount={setAmount}
                                beneficiary={beneficiary}
                                setBeneficiary={setBeneficiary}
                                duration={duration}
                                setDuration={setDuration}
                                customDays={customDays}
                                setCustomDays={setCustomDays}
                                handleLock={handleLock}
                                isPending={isPending}
                            />
                        ) : (
                            <LocksTable
                                locks={locksData || []}
                                currentAddress={address}
                                handleWithdraw={handleWithdraw}
                                isPending={isPending}
                            />
                        )}
                    </>
                ) : isConnected ? (
                    <div className="text-center py-20">
                        <button
                            onClick={() => switchChain({ chainId: 5042002 })}
                            className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white py-4 px-8 rounded-xl font-bold shadow-lg shadow-red-900/20 transition-all hover:scale-105"
                        >
                            Wrong Network - Switch to Arc Testnet
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="bg-slate-900/50 backdrop-blur border border-slate-700/50 rounded-2xl p-12 max-w-2xl mx-auto">
                            <h2 className="text-3xl font-bold mb-4">Welcome to TimeCapsule</h2>
                            <p className="text-gray-400 mb-8">
                                Lock your assets with time-based smart contracts. Send funds to yourself or others with a specified unlock time.
                            </p>
                            <ConnectButton />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Create Lock Form Component
const CreateLockForm = ({ amount, setAmount, beneficiary, setBeneficiary, duration, setDuration, customDays, setCustomDays, handleLock, isPending }: any) => (
    <div className="bg-slate-900/50 backdrop-blur border border-slate-700/50 rounded-2xl p-8">
        <h3 className="text-xl font-bold mb-6">Create New Time Lock</h3>
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Amount (USDC)</label>
                <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white text-lg focus:border-purple-500 outline-none transition"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Beneficiary Address</label>
                <input
                    type="text"
                    value={beneficiary}
                    onChange={e => setBeneficiary(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white font-mono text-sm focus:border-purple-500 outline-none transition"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Lock Duration</label>
                <select
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:border-purple-500 outline-none transition cursor-pointer"
                >
                    <option value="60">1 Minute (Test)</option>
                    <option value="3600">1 Hour</option>
                    <option value="86400">1 Day</option>
                    <option value="604800">1 Week</option>
                    <option value="2592000">30 Days</option>
                    <option value="custom">Custom (Days)</option>
                </select>
            </div>

            {duration === "custom" && (
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Custom Duration (Days)</label>
                    <input
                        type="number"
                        value={customDays}
                        onChange={e => setCustomDays(e.target.value)}
                        placeholder="Enter number of days"
                        className="w-full bg-slate-950 border border-purple-500/50 rounded-xl p-4 text-white focus:border-purple-500 outline-none transition"
                    />
                </div>
            )}

            <button
                onClick={handleLock}
                disabled={isPending || !amount || !beneficiary || (duration === 'custom' && !customDays)}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg shadow-purple-900/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
                {isPending ? "Creating Lock..." : "🔒 Create Lock"}
            </button>
        </div>
    </div>
);

// Locks Table Component
const LocksTable = ({ locks, currentAddress, handleWithdraw, isPending }: any) => {
    const [now, setNow] = useState(Math.floor(Date.now() / 1000));

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Math.floor(Date.now() / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTimeRemaining = (unlockTime: number) => {
        const diff = unlockTime - now;
        if (diff <= 0) return "Ready";

        const days = Math.floor(diff / 86400);
        const hours = Math.floor((diff % 86400) / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;

        if (days > 0) return `${days}d ${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
        return `${minutes}m ${seconds}s`;
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!locks || locks.length === 0) {
        return (
            <div className="bg-slate-900/50 backdrop-blur border border-slate-700/50 rounded-2xl p-12 text-center">
                <Lock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No locks found</p>
                <p className="text-gray-500 text-sm mt-2">Create your first time lock to get started</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {locks.map((lock: any, index: number) => {
                const isUnlocked = now >= Number(lock.unlockTime);
                const isWithdrawn = lock.withdrawn;

                return (
                    <div
                        key={index}
                        className={`bg-slate-900/50 backdrop-blur border rounded-2xl p-6 transition-all hover:shadow-lg ${isWithdrawn
                            ? "border-gray-700/50 opacity-60"
                            : isUnlocked
                                ? "border-green-500/30 shadow-green-900/10"
                                : "border-purple-500/30"
                            }`}
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            {/* Lock Info */}
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-xl ${isWithdrawn ? "bg-gray-700/30" : isUnlocked ? "bg-green-500/20" : "bg-purple-500/20"}`}>
                                        {isWithdrawn ? <Calendar className="w-5 h-5 text-gray-400" /> : isUnlocked ? <Unlock className="w-5 h-5 text-green-400" /> : <Lock className="w-5 h-5 text-purple-400" />}
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{formatEther(lock.amount)} USDC</p>
                                        <p className="text-xs text-gray-500">Lock #{index + 1}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500 mb-1">From</p>
                                        <p className="text-white font-mono">{lock.sender.slice(0, 6)}...{lock.sender.slice(-4)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 mb-1">To</p>
                                        <p className="text-white font-mono">{currentAddress?.slice(0, 6)}...{currentAddress?.slice(-4)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 mb-1">Unlock Date</p>
                                        <p className="text-white">{formatDate(Number(lock.unlockTime))}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 mb-1">Time Remaining</p>
                                        <p className={`font-bold ${isUnlocked ? "text-green-400" : "text-purple-400"}`}>
                                            {isWithdrawn ? "Withdrawn" : formatTimeRemaining(Number(lock.unlockTime))}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Status & Action */}
                            <div className="flex flex-col items-end gap-3">
                                <span className={`px-4 py-2 rounded-full text-xs font-bold ${isWithdrawn
                                    ? "bg-gray-700/30 text-gray-400"
                                    : isUnlocked
                                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                        : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                    }`}>
                                    {isWithdrawn ? "✓ Withdrawn" : isUnlocked ? "Ready" : "Locked"}
                                </span>

                                {!isWithdrawn && isUnlocked && (
                                    <button
                                        onClick={handleWithdraw}
                                        disabled={isPending}
                                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-green-900/20 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                                    >
                                        <Unlock className="w-4 h-4" />
                                        {isPending ? "Processing..." : "Withdraw"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TimeCapsuleUI;