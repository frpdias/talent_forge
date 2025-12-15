import { AuthService } from './auth.service';
import type { JwtPayload } from './auth.service';
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
}
