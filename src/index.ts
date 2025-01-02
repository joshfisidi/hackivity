import { Client } from 'discord-rpc';
import dotenv from 'dotenv';

dotenv.config();

const clientId = process.env.DISCORD_CLIENT_ID;

if (!clientId) {
    console.error('Missing DISCORD_CLIENT_ID in environment variables');
    process.exit(1);
}

// Create RPC client
const client = new Client({ transport: 'ipc' });

// Basic event handlers
client.on('ready', () => {
    console.log('Connected to Discord');
    updateActivity();
});

client.on('disconnected', () => {
    console.log('Disconnected from Discord, attempting to reconnect...');
    connect();
});

// Error handler
client.on('error', (error: Error) => {
    console.error('Discord RPC Error:', error);
});

// Update activity function
function updateActivity() {
    console.log('Setting activity...');
    
    client.setActivity({
        details: 'Development in progress',
        state: 'Buidling pijin.xyz',
        startTimestamp: Date.now(),
        largeImageKey: 'fisidian',       // Updated to match the asset name
        largeImageText: 'Fisidi',
        smallImageKey: 'freek_logo',     // Secondary logo
        smallImageText: 'Freek',
        instance: false,
    }).then(() => {
        console.log('Activity set successfully');
    }).catch((error: Error) => {
        console.error('Failed to set activity:', error);
    });
}

// Connection function
async function connect() {
    try {
        console.log('Connecting to Discord...');
        await client.login({
            clientId,
            transport: 'ipc'
        });
    } catch (error) {
        console.error('Failed to connect:', error);
        process.exit(1);
    }
}

// Start the connection
connect();

// Update activity periodically
setInterval(updateActivity, 15000); // Update every 15 seconds

// Handle graceful shutdown
process.on('SIGINT', () => {
    client.destroy().catch(console.error);
    process.exit(0);
});
