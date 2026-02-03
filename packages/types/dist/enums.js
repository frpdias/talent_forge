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
    JobStatus["OPEN"] = "open";
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW51bXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZW51bXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQzs7O0FBRXJDLElBQVksT0FHWDtBQUhELFdBQVksT0FBTztJQUNqQixvQ0FBeUIsQ0FBQTtJQUN6Qiw4QkFBbUIsQ0FBQTtBQUNyQixDQUFDLEVBSFcsT0FBTyx1QkFBUCxPQUFPLFFBR2xCO0FBRUQsSUFBWSxjQU1YO0FBTkQsV0FBWSxjQUFjO0lBQ3hCLHlDQUF1QixDQUFBO0lBQ3ZCLHlDQUF1QixDQUFBO0lBQ3ZCLHVDQUFxQixDQUFBO0lBQ3JCLDJDQUF5QixDQUFBO0lBQ3pCLHlDQUF1QixDQUFBO0FBQ3pCLENBQUMsRUFOVyxjQUFjLDhCQUFkLGNBQWMsUUFNekI7QUFFRCxJQUFZLGNBT1g7QUFQRCxXQUFZLGNBQWM7SUFDeEIsbUNBQWlCLENBQUE7SUFDakIsNkJBQVcsQ0FBQTtJQUNYLG1DQUFpQixDQUFBO0lBQ2pCLCtCQUFhLENBQUE7SUFDYix1Q0FBcUIsQ0FBQTtJQUNyQix5Q0FBdUIsQ0FBQTtBQUN6QixDQUFDLEVBUFcsY0FBYyw4QkFBZCxjQUFjLFFBT3pCO0FBRUQsSUFBWSxpQkFLWDtBQUxELFdBQVksaUJBQWlCO0lBQzNCLHdDQUFtQixDQUFBO0lBQ25CLDhDQUF5QixDQUFBO0lBQ3pCLG9DQUFlLENBQUE7SUFDZiwwQ0FBcUIsQ0FBQTtBQUN2QixDQUFDLEVBTFcsaUJBQWlCLGlDQUFqQixpQkFBaUIsUUFLNUI7QUFFRCxJQUFZLFNBSVg7QUFKRCxXQUFZLFNBQVM7SUFDbkIsMEJBQWEsQ0FBQTtJQUNiLGdDQUFtQixDQUFBO0lBQ25CLDhCQUFpQixDQUFBO0FBQ25CLENBQUMsRUFKVyxTQUFTLHlCQUFULFNBQVMsUUFJcEI7QUFFRCxJQUFZLGNBRVg7QUFGRCxXQUFZLGNBQWM7SUFDeEIsaURBQStCLENBQUE7QUFDakMsQ0FBQyxFQUZXLGNBQWMsOEJBQWQsY0FBYyxRQUV6QjtBQUVELElBQVksYUFLWDtBQUxELFdBQVksYUFBYTtJQUN2QixnQ0FBZSxDQUFBO0lBQ2Ysb0NBQW1CLENBQUE7SUFDbkIsa0NBQWlCLENBQUE7SUFDakIsa0NBQWlCLENBQUE7QUFDbkIsQ0FBQyxFQUxXLGFBQWEsNkJBQWIsYUFBYSxRQUt4QiIsInNvdXJjZXNDb250ZW50IjpbIi8vIEVudW1zIG1hdGNoaW5nIHRoZSBkYXRhYmFzZSBzY2hlbWFcblxuZXhwb3J0IGVudW0gT3JnVHlwZSB7XG4gIEhFQURIVU5URVIgPSAnaGVhZGh1bnRlcicsXG4gIENPTVBBTlkgPSAnY29tcGFueScsXG59XG5cbmV4cG9ydCBlbnVtIEVtcGxveW1lbnRUeXBlIHtcbiAgRlVMTF9USU1FID0gJ2Z1bGxfdGltZScsXG4gIFBBUlRfVElNRSA9ICdwYXJ0X3RpbWUnLFxuICBDT05UUkFDVCA9ICdjb250cmFjdCcsXG4gIElOVEVSTlNISVAgPSAnaW50ZXJuc2hpcCcsXG4gIEZSRUVMQU5DRSA9ICdmcmVlbGFuY2UnLFxufVxuXG5leHBvcnQgZW51bSBTZW5pb3JpdHlMZXZlbCB7XG4gIEpVTklPUiA9ICdqdW5pb3InLFxuICBNSUQgPSAnbWlkJyxcbiAgU0VOSU9SID0gJ3NlbmlvcicsXG4gIExFQUQgPSAnbGVhZCcsXG4gIERJUkVDVE9SID0gJ2RpcmVjdG9yJyxcbiAgRVhFQ1VUSVZFID0gJ2V4ZWN1dGl2ZScsXG59XG5cbmV4cG9ydCBlbnVtIEFwcGxpY2F0aW9uU3RhdHVzIHtcbiAgQVBQTElFRCA9ICdhcHBsaWVkJyxcbiAgSU5fUFJPQ0VTUyA9ICdpbl9wcm9jZXNzJyxcbiAgSElSRUQgPSAnaGlyZWQnLFxuICBSRUpFQ1RFRCA9ICdyZWplY3RlZCcsXG59XG5cbmV4cG9ydCBlbnVtIEpvYlN0YXR1cyB7XG4gIE9QRU4gPSAnb3BlbicsXG4gIE9OX0hPTEQgPSAnb25faG9sZCcsXG4gIENMT1NFRCA9ICdjbG9zZWQnLFxufVxuXG5leHBvcnQgZW51bSBBc3Nlc3NtZW50S2luZCB7XG4gIEJFSEFWSU9SQUxfVjEgPSAnYmVoYXZpb3JhbF92MScsXG59XG5cbmV4cG9ydCBlbnVtIE9yZ01lbWJlclJvbGUge1xuICBBRE1JTiA9ICdhZG1pbicsXG4gIE1BTkFHRVIgPSAnbWFuYWdlcicsXG4gIE1FTUJFUiA9ICdtZW1iZXInLFxuICBWSUVXRVIgPSAndmlld2VyJyxcbn1cbiJdfQ==