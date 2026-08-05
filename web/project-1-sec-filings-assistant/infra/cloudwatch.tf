# Where the app's log file (shipped by the CloudWatch Agent — see
# user_data.sh.tpl) actually lands.
resource "aws_cloudwatch_log_group" "app" {
  name              = "/${var.project_name}/app"
  retention_in_days = 14
}

# AWS-managed policy for the CloudWatch Agent itself (ships logs, can also
# publish its own host metrics). Same reasoning as the SSM policy in
# iam.tf: using the managed policy instead of hand-rolling a trimmed one,
# after the earlier SSM Agent lesson showed that's a fragile trade for a
# personal project.
resource "aws_iam_role_policy_attachment" "cloudwatch_agent" {
  role       = aws_iam_role.app.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# Turns specific fields out of the app's structured "llm_request" log
# lines (see backend/src/index.ts) into real CloudWatch metrics — no
# code in the request path calls a metrics API directly, this just parses
# what already got logged.
resource "aws_cloudwatch_log_metric_filter" "llm_latency" {
  name           = "${var.project_name}-llm-latency"
  log_group_name = aws_cloudwatch_log_group.app.name
  pattern        = "{ $.metric = \"llm_request\" }"

  metric_transformation {
    name          = "LLMLatencyMs"
    namespace     = "SecFilingsAssistant"
    value         = "$.latencyMs"
    default_value = "0"
  }
}

resource "aws_cloudwatch_log_metric_filter" "llm_cost" {
  name           = "${var.project_name}-llm-cost"
  log_group_name = aws_cloudwatch_log_group.app.name
  pattern        = "{ $.metric = \"llm_request\" }"

  metric_transformation {
    name          = "LLMCostUsd"
    namespace     = "SecFilingsAssistant"
    value         = "$.estimatedCostUsd"
    default_value = "0"
  }
}

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "LLM request latency (ms)"
          view   = "timeSeries"
          region = var.aws_region
          metrics = [
            ["SecFilingsAssistant", "LLMLatencyMs", { stat = "Average", label = "avg" }],
            ["SecFilingsAssistant", "LLMLatencyMs", { stat = "p90", label = "p90" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "LLM cost per request (USD)"
          view   = "timeSeries"
          region = var.aws_region
          metrics = [
            ["SecFilingsAssistant", "LLMCostUsd", { stat = "Sum", label = "total cost" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "ALB — request count & target response time"
          view   = "timeSeries"
          region = var.aws_region
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", aws_lb.main.arn_suffix, { stat = "Sum" }],
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", aws_lb.main.arn_suffix, { stat = "Average" }]
          ]
        }
      }
    ]
  })
}
