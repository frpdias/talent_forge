import { TfciService } from './tfci.service';
import { CreateTfciCycleDto, UpdateTfciCycleDto, CreateTfciAssessmentDto } from './dto/tfci-cycle.dto';
export declare class TfciController {
    private readonly tfciService;
    constructor(tfciService: TfciService);
    createCycle(orgId: string, userId: string, dto: CreateTfciCycleDto): Promise<import("./entities/tfci-cycle.entity").TfciCycle>;
    getCycles(orgId: string): Promise<import("./entities/tfci-cycle.entity").TfciCycle[]>;
    getCycleById(orgId: string, cycleId: string): Promise<import("./entities/tfci-cycle.entity").TfciCycle>;
    updateCycle(orgId: string, cycleId: string, dto: UpdateTfciCycleDto): Promise<import("./entities/tfci-cycle.entity").TfciCycle>;
    deleteCycle(orgId: string, cycleId: string): Promise<{
        message: string;
    }>;
    createAssessment(orgId: string, userId: string, dto: CreateTfciAssessmentDto): Promise<import("./entities/tfci-cycle.entity").TfciAssessment>;
    getAssessmentsByCycle(orgId: string, cycleId: string): Promise<import("./entities/tfci-cycle.entity").TfciAssessment[]>;
    getHeatmapData(orgId: string, cycleId: string): Promise<import("./entities/tfci-cycle.entity").TfciHeatmapData[]>;
}
