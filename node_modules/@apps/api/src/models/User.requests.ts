import { DepartmentType, UserRole } from "../constants/enum";

export interface RegisterReqBody {
  factory_id: number;
  username: string;
  password: string;
  name: string;
  department: DepartmentType;
  role: UserRole;
}
