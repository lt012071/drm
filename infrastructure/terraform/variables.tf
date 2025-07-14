variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "drm"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["ap-northeast-1a", "ap-northeast-1c"]
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}

# アプリケーション設定
variable "backend_image" {
  description = "Backend Docker image"
  type        = string
  default     = "drm-backend:latest"
}

variable "frontend_image" {
  description = "Frontend Docker image"
  type        = string
  default     = "drm-frontend:latest"
}

variable "backend_port" {
  description = "Backend application port"
  type        = number
  default     = 3001
}

variable "frontend_port" {
  description = "Frontend application port"
  type        = number
  default     = 3000
}

# データベース設定
variable "db_username" {
  description = "Database username"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

# 環境変数
variable "environment_variables" {
  description = "Environment variables for the application"
  type        = map(string)
  default     = {}
  sensitive   = true
}