const hre = require("hardhat");

async function main() {
    console.log("🚀 Deploying TimeCapsule contract to Arc Testnet...");
    console.log("Network:", hre.network.name);
    console.log("RPC URL:", hre.network.config.url);

    const TimeCapsule = await hre.ethers.getContractFactory("TimeCapsule");
    console.log("Deploying contract...");

    const timeCapsule = await TimeCapsule.deploy();
    console.log("Transaction Hash:", timeCapsule.deploymentTransaction().hash);
    console.log("Waiting for deployment...");

    await timeCapsule.waitForDeployment();

    const address = await timeCapsule.getAddress();

    console.log("\n✅ SUCCESS! TimeCapsule deployed to:", address);
    console.log("\n📋 NEXT STEP: Copy this address and update TimeCapsuleUI.tsx line 14");
    console.log("Replace: const CONTRACT_ADDRESS = \"0x0000...\"");
    console.log("With:    const CONTRACT_ADDRESS = \"" + address + "\"");
}

main().catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exitCode = 1;
});
