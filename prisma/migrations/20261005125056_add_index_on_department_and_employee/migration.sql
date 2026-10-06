-- RenameIndex
ALTER TABLE `department` RENAME INDEX `Department_companyId_fkey` TO `Department_companyId_idx`;

-- RenameIndex
ALTER TABLE `employee` RENAME INDEX `Employee_departmentId_fkey` TO `Employee_departmentId_idx`;
