import mongoose from "mongoose";
import dns from "node:dns";

const DEFAULT_DB_NAME = "EduTech";
const FALLBACK_DNS = ["8.8.8.8", "1.1.1.1"];
const MONGO_CONNECT_OPTIONS = {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
};

const cleanEnvValue = (value = "") => String(value).trim().replace(/^['"]|['"]$/g, "");

const resolveMongoUri = () => {
    const rawUri = cleanEnvValue(process.env.MONGODB_URI);
    if (!rawUri) {
        throw new Error("MONGODB_URI is missing in .env");
    }

    let parsed;
    try {
        parsed = new URL(rawUri);
    } catch (error) {
        throw new Error("Invalid MONGODB_URI format");
    }

    if (!parsed.pathname || parsed.pathname === "/") {
        parsed.pathname = `/${DEFAULT_DB_NAME}`;
    }

    return parsed.toString();
};

const configureDnsServers = (dnsServers) => {
    const normalizedServers = dnsServers
        .map((server) => cleanEnvValue(server))
        .filter(Boolean);

    if (normalizedServers.length > 0) {
        dns.setServers(normalizedServers);
    }
};

const connectDB = async () => {
    const mongoUri = resolveMongoUri();
    mongoose.connection.on("connected", () => console.log("MongoDB connected"));

    const initialDns = cleanEnvValue(process.env.MONGODB_DNS_SERVERS);
    if (initialDns) {
        configureDnsServers(initialDns.split(","));
    }

    try {
        await mongoose.connect(mongoUri, MONGO_CONNECT_OPTIONS);
    } catch (error) {
        const shouldRetryWithFallbackDns =
            mongoUri.startsWith("mongodb+srv://") &&
            ["EREFUSED", "ENOTFOUND", "ETIMEOUT"].includes(error?.code);

        if (!shouldRetryWithFallbackDns) {
            throw error;
        }

        console.warn("MongoDB SRV DNS lookup failed. Retrying with public DNS servers...");
        configureDnsServers(FALLBACK_DNS);
        await mongoose.connect(mongoUri, MONGO_CONNECT_OPTIONS);
    }
};

export default connectDB;
