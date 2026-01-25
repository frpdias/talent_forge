import { AuthService } from './auth.service';
import type { JwtPayload } from './auth.service';
import type { Response } from 'express';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    me(user: JwtPayload): Promise<{
        id: string;
        email: string | undefined;
        organizations: {
            org_id: any;
            role: any;
            organizations: {
                id: any;
                name: any;
                org_type: any;
                slug: any;
            }[];
        }[];
    }>;
    health(): {
        status: string;
        timestamp: string;
    };
    authorizeGoogleCalendar(user: JwtPayload): Promise<{
        url: string;
    }>;
    googleCalendarCallback(code: string, state: string, res: Response): Promise<void>;
    googleCalendarStatus(user: JwtPayload): Promise<{
        connected: boolean;
        email?: undefined;
    } | {
        connected: boolean;
        email: any;
    }>;
    googleCalendarDisconnect(user: JwtPayload): Promise<{
        connected: boolean;
    }>;
}
