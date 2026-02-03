import { CreateTfciCycleDto, UpdateTfciCycleDto, CreateTfciAssessmentDto } from './dto/tfci-cycle.dto';
import { TfciCycle, TfciAssessment, TfciHeatmapData } from './entities/tfci-cycle.entity';
export declare class TfciService {
    private supabase;
    createCycle(orgId: string, userId: string, dto: CreateTfciCycleDto): Promise<TfciCycle>;
    getCycles(orgId: string): Promise<TfciCycle[]>;
    getCycleById(orgId: string, cycleId: string): Promise<TfciCycle>;
    updateCycle(orgId: string, cycleId: string, dto: UpdateTfciCycleDto): Promise<TfciCycle>;
    deleteCycle(orgId: string, cycleId: string): Promise<void>;
    createAssessment(orgId: string, userId: string, dto: CreateTfciAssessmentDto): Promise<TfciAssessment>;
    getAssessmentsByCycle(orgId: string, cycleId: string): Promise<TfciAssessment[]>;
    getHeatmapData(orgId: string, cycleId: string): Promise<TfciHeatmapData[]>;
    private updateCycleStats;
}
