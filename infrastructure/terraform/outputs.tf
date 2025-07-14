output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = module.ecs.alb_dns_name
}

output "alb_hosted_zone_id" {
  description = "Application Load Balancer hosted zone ID"
  value       = module.ecs.alb_zone_id
}

output "database_endpoint" {
  description = "RDS instance endpoint"
  value       = module.database.database_endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = module.database.redis_endpoint
  sensitive   = true
}

output "application_url" {
  description = "Application URL"
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "http://${module.ecs.alb_dns_name}"
}