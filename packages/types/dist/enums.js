"use strict";
// Enums matching the database schema
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgMemberRole = exports.AssessmentKind = exports.JobStatus = exports.ApplicationStatus = exports.SeniorityLevel = exports.EmploymentType = exports.OrgType = void 0;
var OrgType;
(function (OrgType) {
    OrgType["HEADHUNTER"] = "headhunter";
    OrgType["COMPANY"] = "company";
})(OrgType || (exports.OrgType = OrgType = {}));
var EmploymentType;
(function (EmploymentType) {
    EmploymentType["FULL_TIME"] = "full_time";
    EmploymentType["PART_TIME"] = "part_time";
    EmploymentType["CONTRACT"] = "contract";
    EmploymentType["INTERNSHIP"] = "internship";
    EmploymentType["FREELANCE"] = "freelance";
})(EmploymentType || (exports.EmploymentType = EmploymentType = {}));
var SeniorityLevel;
(function (SeniorityLevel) {
    SeniorityLevel["JUNIOR"] = "junior";
    SeniorityLevel["MID"] = "mid";
    SeniorityLevel["SENIOR"] = "senior";
    SeniorityLevel["LEAD"] = "lead";
    SeniorityLevel["DIRECTOR"] = "director";
    SeniorityLevel["EXECUTIVE"] = "executive";
})(SeniorityLevel || (exports.SeniorityLevel = SeniorityLevel = {}));
var ApplicationStatus;
(function (ApplicationStatus) {
    ApplicationStatus["APPLIED"] = "applied";
    ApplicationStatus["IN_PROCESS"] = "in_process";
    ApplicationStatus["HIRED"] = "hired";
    ApplicationStatus["REJECTED"] = "rejected";
})(ApplicationStatus || (exports.ApplicationStatus = ApplicationStatus = {}));
var JobStatus;
(function (JobStatus) {
    JobStatus["DRAFT"] = "draft";
    JobStatus["OPEN"] = "open";
    JobStatus["PAUSED"] = "paused";
    JobStatus["ON_HOLD"] = "on_hold";
    JobStatus["CLOSED"] = "closed";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
var AssessmentKind;
(function (AssessmentKind) {
    AssessmentKind["BEHAVIORAL_V1"] = "behavioral_v1";
})(AssessmentKind || (exports.AssessmentKind = AssessmentKind = {}));
var OrgMemberRole;
(function (OrgMemberRole) {
    OrgMemberRole["ADMIN"] = "admin";
    OrgMemberRole["MANAGER"] = "manager";
    OrgMemberRole["MEMBER"] = "member";
    OrgMemberRole["VIEWER"] = "viewer";
})(OrgMemberRole || (exports.OrgMemberRole = OrgMemberRole = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW51bXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZW51bXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQzs7O0FBRXJDLElBQVksT0FHWDtBQUhELFdBQVksT0FBTztJQUNqQixvQ0FBeUIsQ0FBQTtJQUN6Qiw4QkFBbUIsQ0FBQTtBQUNyQixDQUFDLEVBSFcsT0FBTyx1QkFBUCxPQUFPLFFBR2xCO0FBRUQsSUFBWSxjQU1YO0FBTkQsV0FBWSxjQUFjO0lBQ3hCLHlDQUF1QixDQUFBO0lBQ3ZCLHlDQUF1QixDQUFBO0lBQ3ZCLHVDQUFxQixDQUFBO0lBQ3JCLDJDQUF5QixDQUFBO0lBQ3pCLHlDQUF1QixDQUFBO0FBQ3pCLENBQUMsRUFOVyxjQUFjLDhCQUFkLGNBQWMsUUFNekI7QUFFRCxJQUFZLGNBT1g7QUFQRCxXQUFZLGNBQWM7SUFDeEIsbUNBQWlCLENBQUE7SUFDakIsNkJBQVcsQ0FBQTtJQUNYLG1DQUFpQixDQUFBO0lBQ2pCLCtCQUFhLENBQUE7SUFDYix1Q0FBcUIsQ0FBQTtJQUNyQix5Q0FBdUIsQ0FBQTtBQUN6QixDQUFDLEVBUFcsY0FBYyw4QkFBZCxjQUFjLFFBT3pCO0FBRUQsSUFBWSxpQkFLWDtBQUxELFdBQVksaUJBQWlCO0lBQzNCLHdDQUFtQixDQUFBO0lBQ25CLDhDQUF5QixDQUFBO0lBQ3pCLG9DQUFlLENBQUE7SUFDZiwwQ0FBcUIsQ0FBQTtBQUN2QixDQUFDLEVBTFcsaUJBQWlCLGlDQUFqQixpQkFBaUIsUUFLNUI7QUFFRCxJQUFZLFNBTVg7QUFORCxXQUFZLFNBQVM7SUFDbkIsNEJBQWUsQ0FBQTtJQUNmLDBCQUFhLENBQUE7SUFDYiw4QkFBaUIsQ0FBQTtJQUNqQixnQ0FBbUIsQ0FBQTtJQUNuQiw4QkFBaUIsQ0FBQTtBQUNuQixDQUFDLEVBTlcsU0FBUyx5QkFBVCxTQUFTLFFBTXBCO0FBRUQsSUFBWSxjQUVYO0FBRkQsV0FBWSxjQUFjO0lBQ3hCLGlEQUErQixDQUFBO0FBQ2pDLENBQUMsRUFGVyxjQUFjLDhCQUFkLGNBQWMsUUFFekI7QUFFRCxJQUFZLGFBS1g7QUFMRCxXQUFZLGFBQWE7SUFDdkIsZ0NBQWUsQ0FBQTtJQUNmLG9DQUFtQixDQUFBO0lBQ25CLGtDQUFpQixDQUFBO0lBQ2pCLGtDQUFpQixDQUFBO0FBQ25CLENBQUMsRUFMVyxhQUFhLDZCQUFiLGFBQWEsUUFLeEIiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBFbnVtcyBtYXRjaGluZyB0aGUgZGF0YWJhc2Ugc2NoZW1hXG5cbmV4cG9ydCBlbnVtIE9yZ1R5cGUge1xuICBIRUFESFVOVEVSID0gJ2hlYWRodW50ZXInLFxuICBDT01QQU5ZID0gJ2NvbXBhbnknLFxufVxuXG5leHBvcnQgZW51bSBFbXBsb3ltZW50VHlwZSB7XG4gIEZVTExfVElNRSA9ICdmdWxsX3RpbWUnLFxuICBQQVJUX1RJTUUgPSAncGFydF90aW1lJyxcbiAgQ09OVFJBQ1QgPSAnY29udHJhY3QnLFxuICBJTlRFUk5TSElQID0gJ2ludGVybnNoaXAnLFxuICBGUkVFTEFOQ0UgPSAnZnJlZWxhbmNlJyxcbn1cblxuZXhwb3J0IGVudW0gU2VuaW9yaXR5TGV2ZWwge1xuICBKVU5JT1IgPSAnanVuaW9yJyxcbiAgTUlEID0gJ21pZCcsXG4gIFNFTklPUiA9ICdzZW5pb3InLFxuICBMRUFEID0gJ2xlYWQnLFxuICBESVJFQ1RPUiA9ICdkaXJlY3RvcicsXG4gIEVYRUNVVElWRSA9ICdleGVjdXRpdmUnLFxufVxuXG5leHBvcnQgZW51bSBBcHBsaWNhdGlvblN0YXR1cyB7XG4gIEFQUExJRUQgPSAnYXBwbGllZCcsXG4gIElOX1BST0NFU1MgPSAnaW5fcHJvY2VzcycsXG4gIEhJUkVEID0gJ2hpcmVkJyxcbiAgUkVKRUNURUQgPSAncmVqZWN0ZWQnLFxufVxuXG5leHBvcnQgZW51bSBKb2JTdGF0dXMge1xuICBEUkFGVCA9ICdkcmFmdCcsXG4gIE9QRU4gPSAnb3BlbicsXG4gIFBBVVNFRCA9ICdwYXVzZWQnLFxuICBPTl9IT0xEID0gJ29uX2hvbGQnLFxuICBDTE9TRUQgPSAnY2xvc2VkJyxcbn1cblxuZXhwb3J0IGVudW0gQXNzZXNzbWVudEtpbmQge1xuICBCRUhBVklPUkFMX1YxID0gJ2JlaGF2aW9yYWxfdjEnLFxufVxuXG5leHBvcnQgZW51bSBPcmdNZW1iZXJSb2xlIHtcbiAgQURNSU4gPSAnYWRtaW4nLFxuICBNQU5BR0VSID0gJ21hbmFnZXInLFxuICBNRU1CRVIgPSAnbWVtYmVyJyxcbiAgVklFV0VSID0gJ3ZpZXdlcicsXG59XG4iXX0=