import HTTP_STATUS from "../constants/httpStatus";
import { USERS_MESSAGES } from "../constants/messages";

// định nghịa trạng thái, message lỗi trả về
export class ErrorWithStatus {
  message: string;
  status: number;
  constructor({ message, status }: { message: string; status: number }) {
    (this.message = message), (this.status = status);
  }
}

// tạo kiểu lỗi
type ErrorType = Record<
  string, // tên field lỗi
  {
    msg: string; // ít nhất phải có 1 cái thuộc tính
    [key: string]: any; // muốn thêm thì thêm
  }
>;

// class này chỉ bắt lỗi input
export class EntityError extends ErrorWithStatus {
  errors: ErrorType;
  //truyển message mặc định
  constructor({
    message = USERS_MESSAGES.VALIDATION_ERROR,
    errors,
  }: {
    message?: string;
    errors: ErrorType;
  }) {
    super({ message, status: HTTP_STATUS.UNPROCESSABLE_ENTITY }); //tạo lỗi có status 422
    this.errors = errors;
  }
}
