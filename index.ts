import { Client } from 'discord-rpc';

const clientId = '1323427133393076315';
const UPDATE_INTERVAL = 15000; // Update every 15 seconds

// Update these with your hosted URL
const redirectUri = 'https://fisidi-discord-rpc.vercel.app/callback';
const scopes = ['rpc', 'activities.write'];

interface RPCActivity {
    details: string;
    state: string;
    startTimestamp: number;
    largeImageKey: string;
    largeImageText: string;
    smallImageKey: string;
    smallImageText: string;
    instance: boolean;
    buttons: Array<{
        label: string;
        url: string;
    }>;
}

class DiscordRPC {
    private client: Client;
    private connected: boolean = false;
    private updateInterval?: NodeJS.Timeout;
    private startTimestamp: number;
    private retryCount: number = 0;
    private readonly maxRetries: number = 3;

    constructor() {
        this.client = new Client({ transport: 'ipc' });
        this.startTimestamp = Date.now();
        this.registerEvents();
    }

    private registerEvents(): void {
        this.client.on('ready', () => {
            const user = this.client.user;
            console.log(`Discord RPC Connected! User: ${user?.username}#${user?.discriminator}`);
            this.connected = true;
            this.retryCount = 0; // Reset retry count on successful connection
            this.updateActivity();
            this.startPeriodicUpdates();
        });

        this.client.on('disconnected', () => {
            console.log('Discord RPC disconnected!');
            this.connected = false;
            this.stopPeriodicUpdates();
            this.attemptReconnect();
        });

        this.client.on('error', (error: Error) => {
            console.error('Discord RPC Error:', error);
            if (error.message.includes('OAuth2')) {
                console.log('Please authorize the application at:');
                console.log(`https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes.join('%20')}`);
            }
            if (!this.connected) {
                this.stopPeriodicUpdates();
                this.attemptReconnect();
            }
        });
    }

    private startPeriodicUpdates(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.updateInterval = setInterval(() => {
            if (this.connected) {
                this.updateActivity();
            }
        }, UPDATE_INTERVAL);
    }

    private stopPeriodicUpdates(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = undefined;
        }
    }

    private async updateActivity(): Promise<void> {
        const activity: RPCActivity = {
            details: 'Join Fire Development',
            state: '🔹 Join Fire Development State',
            startTimestamp: this.startTimestamp,
            instance: true,
            largeImageKey: 'freek_logo',
            largeImageText: 'Fisidi Development',
            smallImageKey: 'fisidi_logo',
            smallImageText: '👹',
            buttons: [{
                label: 'Join Server',
                url: 'https://discord.gg/EyWNsA97cQ'
            }, {
                label: 'Website',
                url: 'https://fisidi.com'
            }]
        };

        try {
            await this.client.setActivity(activity);
            console.log('Activity successfully set');
        } catch (error) {
            console.error('Failed to set activity:', error);
            if (!this.connected) {
                this.stopPeriodicUpdates();
                this.attemptReconnect();
            }
        }
    }

    private async attemptReconnect(): Promise<void> {
        if (this.retryCount >= this.maxRetries) {
            console.log('Max retry attempts reached. Please restart the application.');
            this.disconnect();
            process.exit(1);
            return;
        }

        this.retryCount++;
        console.log(`Attempting to reconnect... (Attempt ${this.retryCount}/${this.maxRetries})`);
        
        try {
            await this.connect();
        } catch (error) {
            console.error('Reconnection failed:', error);
            setTimeout(() => this.attemptReconnect(), Math.min(10000 * this.retryCount, 30000));
        }
    }

    public async connect(): Promise<void> {
        try {
            console.log('Initializing Discord RPC...');
            await this.client.login({
                clientId,
                scopes,
                redirectUri
            });
        } catch (error) {
            console.error('Failed to connect to Discord:', error);
            throw error;
        }
    }

    public disconnect(): void {
        this.stopPeriodicUpdates();
        if (this.client) {
            this.client.clearActivity()
                .then(() => this.client.destroy())
                .catch(console.error);
        }
    }
}

// Initialize and connect
const rpc = new DiscordRPC();
rpc.connect();

// Handle process termination
process.on('SIGINT', () => {
    rpc.disconnect();
    process.exit();
});

process.on('SIGTERM', () => {
    rpc.disconnect();
    process.exit();
});
