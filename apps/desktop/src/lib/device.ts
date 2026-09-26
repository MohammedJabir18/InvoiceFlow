import { isTauri } from "./api";

export interface DeviceEnvironment {
    isTauri: boolean;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    osName: string;
    browserName: string;
    deviceBadge: string;
    storageDescription: string;
}

export function getDeviceEnvironment(): DeviceEnvironment {
    if (typeof window === "undefined") {
        return {
            isTauri: false,
            isMobile: false,
            isTablet: false,
            isDesktop: true,
            osName: "Unknown",
            browserName: "Browser",
            deviceBadge: "🌐 Web Browser",
            storageDescription: "Standard browser Downloads folder"
        };
    }

    const ua = navigator.userAgent || "";
    const isNative = isTauri();

    // OS Detection
    let osName = "Unknown OS";
    if (/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
        osName = "iOS";
    } else if (/Android/i.test(ua)) {
        osName = "Android";
    } else if (/Win/i.test(ua)) {
        osName = "Windows";
    } else if (/Mac/i.test(ua)) {
        osName = "macOS";
    } else if (/Linux/i.test(ua)) {
        osName = "Linux";
    }

    // Form Factor Detection
    const isIosTablet = (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) || /iPad/i.test(ua);
    const isAndroidTablet = /Android/i.test(ua) && !/Mobile/i.test(ua);
    const isTablet = isIosTablet || isAndroidTablet || (typeof window !== "undefined" && window.innerWidth >= 768 && window.innerWidth <= 1024 && (navigator.maxTouchPoints || 0) > 0);
    const isMobile = !isTablet && (/Mobi|Android|iPhone|iPod/i.test(ua) || (typeof window !== "undefined" && window.innerWidth < 768));
    const isDesktop = !isMobile && !isTablet;

    // Browser Detection
    let browserName = "Browser";
    if (/Edg\//i.test(ua)) browserName = "Edge";
    else if (/Chrome\//i.test(ua)) browserName = "Chrome";
    else if (/Safari\//i.test(ua)) browserName = "Safari";
    else if (/Firefox\//i.test(ua)) browserName = "Firefox";

    // Dynamic Badge & Storage Description
    let deviceBadge = "🌐 Web Browser";
    let storageDescription = "Browser Downloads folder";

    if (isNative) {
        deviceBadge = `💻 Desktop App (${osName})`;
        storageDescription = `System Downloads (${osName === "Windows" ? "Downloads" : "~/Downloads"})`;
    } else if (isMobile) {
        if (osName === "iOS") {
            deviceBadge = "📱 Apple iOS Device";
            storageDescription = "Apple Files / Safari Downloads (Automatic)";
        } else if (osName === "Android") {
            deviceBadge = "📱 Android Device";
            storageDescription = "Device Downloads Folder (Automatic)";
        } else {
            deviceBadge = "📱 Mobile Browser";
            storageDescription = "Device Downloads (Automatic)";
        }
    } else if (isTablet) {
        deviceBadge = `📱 Tablet (${osName})`;
        storageDescription = "Device Files / Downloads (Automatic)";
    } else {
        deviceBadge = `💻 Desktop Web (${browserName} on ${osName})`;
        storageDescription = "Browser Downloads Folder (Automatic)";
    }

    return {
        isTauri: isNative,
        isMobile,
        isTablet,
        isDesktop,
        osName,
        browserName,
        deviceBadge,
        storageDescription
    };
}
