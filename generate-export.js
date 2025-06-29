#!/usr/bin/env node

/**
 * Paramify Codebase Export Tool
 * Generates a comprehensive export of the entire codebase for LLM analysis
 */

const fs = require('fs');
const path = require('path');

// Key files to export
const filesToExport = [
    // Smart Contracts
    'contracts/Paramify.sol',
    'contracts/mocks/MockV3Aggregator.sol',
    
    // Backend
    'backend/server.js',
    'backend/package.json',
    
    // Frontend
    'frontend/src/App.tsx',
    'frontend/src/InsuracleDashboard.tsx',
    'frontend/src/InsuracleDashboardAdmin.tsx',
    'frontend/src/lib/contract.ts',
    'frontend/src/lib/usgsApi.ts',
    'frontend/package.json',
    
    // Scripts
    'scripts/deploy.js',
    'scripts/deployMock.js',
    'scripts/fund-contract.js',
    
    // Configuration
    'hardhat.config.js',
    'package.json',
    'paramify-abi.json',
    
    // Documentation
    'README.md',
    'AGENT_SYSTEMS_INSTRUCTIONS.md',
    'THRESHOLD_DEPLOYMENT_GUIDE.md',
    'USGS_INTEGRATION_GUIDE.md'
];

function generateCodebaseExport() {
    const exportContent = [];
    
    // Header
    exportContent.push(`# Paramify Codebase - Complete Export for LLM Analysis`);
    exportContent.push(`Generated on: ${new Date().toISOString()}`);
    exportContent.push(`Branch: NFT`);
    exportContent.push(`\n---\n`);
    
    // Project overview
    exportContent.push(`## Project Overview`);
    exportContent.push(`Paramify is a blockchain-based flood insurance protocol featuring:`);
    exportContent.push(`- Smart contracts for insurance logic with ERC-721 NFT policy management`);
    exportContent.push(`- Real-time USGS water level data integration`);
    exportContent.push(`- Automatic payout triggers when flood thresholds are exceeded`);
    exportContent.push(`- Soulbound NFT policies with on-chain metadata`);
    exportContent.push(`- Admin and customer dashboards`);
    exportContent.push(`\n---\n`);
    
    // Export each file
    filesToExport.forEach(filePath => {
        const fullPath = path.resolve(filePath);
        
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const fileExtension = path.extname(filePath);
            const language = getLanguageFromExtension(fileExtension);
            
            exportContent.push(`## File: ${filePath}`);
            exportContent.push(`\`\`\`${language}`);
            exportContent.push(content);
            exportContent.push(`\`\`\``);
            exportContent.push(`\n---\n`);
        } else {
            exportContent.push(`## File: ${filePath} (Not Found)`);
            exportContent.push(`\n---\n`);
        }
    });
    
    // Architecture notes
    exportContent.push(`## Architecture Notes`);
    exportContent.push(`### Data Flow`);
    exportContent.push(`1. USGS API → Backend (converts feet to contract units × 100,000,000,000)`);
    exportContent.push(`2. Backend → Smart Contract Oracle (updates flood level)`);
    exportContent.push(`3. Smart Contract → Policy Logic (compares against threshold)`);
    exportContent.push(`4. Frontend ← Backend (displays in user-friendly feet format)`);
    exportContent.push(``);
    exportContent.push(`### NFT Policy System`);
    exportContent.push(`- Each policy is an ERC-721 NFT with soulbound properties`);
    exportContent.push(`- On-chain metadata with SVG images showing policy status`);
    exportContent.push(`- Real-time updates when policy status changes`);
    exportContent.push(`- Comprehensive admin dashboard for policy management`);
    exportContent.push(``);
    exportContent.push(`### Deployment Workflow`);
    exportContent.push(`1. Start Hardhat node: \`npx hardhat node\``);
    exportContent.push(`2. Deploy contracts: \`npx hardhat run scripts/deploy.js --network localhost\``);
    exportContent.push(`3. Update contract addresses in backend/.env and frontend/src/lib/contract.ts`);
    exportContent.push(`4. Start backend: \`cd backend; npm start\` (Windows) or \`cd backend && npm start\` (Unix)`);
    exportContent.push(`5. Start frontend: \`cd frontend; npm run dev\``);
    
    return exportContent.join('\n');
}

function getLanguageFromExtension(ext) {
    const languageMap = {
        '.sol': 'solidity',
        '.js': 'javascript',
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.json': 'json',
        '.md': 'markdown',
        '.env': 'bash'
    };
    return languageMap[ext] || 'text';
}

// Generate the export
const exportedCodebase = generateCodebaseExport();

// Write to file
fs.writeFileSync('COMPLETE_CODEBASE_EXPORT.md', exportedCodebase);

console.log('✅ Codebase export generated: COMPLETE_CODEBASE_EXPORT.md');
console.log('📊 File size:', (exportedCodebase.length / 1024).toFixed(2), 'KB');
console.log('📁 Files included:', filesToExport.length);
