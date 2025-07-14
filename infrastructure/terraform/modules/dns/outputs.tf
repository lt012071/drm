output "hosted_zone_id" {
  description = "Route53 hosted zone ID"
  value       = var.domain_name != "" ? aws_route53_zone.main[0].zone_id : null
}

output "certificate_arn" {
  description = "ACM certificate ARN"
  value       = var.domain_name != "" ? aws_acm_certificate.main[0].arn : null
}

output "nameservers" {
  description = "Route53 hosted zone nameservers"
  value       = var.domain_name != "" ? aws_route53_zone.main[0].name_servers : null
}