from typing import Any, Dict, List, Optional

from pydantic import BaseModel


# Response Models
class TokenRisk(BaseModel):
    """Model for token risk assessment."""

    name: Optional[str] = None
    description: Optional[str] = None
    score: Optional[float] = None

    @property
    def formatted_response(self) -> str:
        """Format risk assessment for display."""
        if not all([self.name, self.description, self.score]):
            return "- Incomplete risk data"
        return f"- {self.name}: {self.description} (Risk Score: {self.score:.2f})"


class TokenReport(BaseModel):
    """Model for complete token analysis report."""

    score: Optional[float] = None
    risks: Optional[List[TokenRisk]] = []

    @property
    def formatted_response(self) -> str:
        """Format complete report for display."""
        formatted = "# Token Risk Analysis Report\n\n"
        formatted += f"Overall Risk Score: {f'{self.score:.2f}' if self.score is not None else 'Unknown'}\n\n"
        formatted += "## Risk Assessments:\n\n"
        if self.risks:
            for risk in self.risks:
                formatted += f"{risk.formatted_response}\n"
        else:
            formatted += "No risk assessments available\n"
        return formatted


class TokenReportResponse(BaseModel):
    """Model for token report API response."""

    report: Optional[TokenReport] = None
    mint_address: Optional[str] = None
    token_name: Optional[str] = None
    identifier: Optional[str] = None

    @property
    def formatted_response(self) -> str:
        """Format complete response for display."""
        formatted = f"# Analysis Report for {self.token_name or 'Unknown Token'}\n\n"
        formatted += f"Mint Address: {self.mint_address or 'Unknown'}\n"
        formatted += f"Identifier: {self.identifier or 'Unknown'}\n\n"
        if self.report:
            formatted += self.report.formatted_response
        else:
            formatted += "No report data available"
        return formatted


class ViewedToken(BaseModel):
    """Model for token view statistics."""

    mint: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}
    visits: Optional[int] = 0
    user_visits: Optional[int] = 0

    @property
    def formatted_response(self) -> str:
        """Format view statistics for display."""
        name = self.metadata.get("name", "Unknown Token") if self.metadata else "Unknown Token"
        symbol = self.metadata.get("symbol", "???") if self.metadata else "???"
        formatted = f"## {name} ({symbol})\n"
        formatted += f"- Mint Address: {self.mint or 'Unknown'}\n"
        formatted += f"- Total Visits: {self.visits:,}\n"
        formatted += f"- Unique Visitors: {self.user_visits:,}\n"
        return formatted


class ViewedTokensResponse(BaseModel):
    """Model for viewed tokens API response."""

    tokens: Optional[List[ViewedToken]] = []

    @property
    def formatted_response(self) -> str:
        """Format complete response for display."""
        formatted = "# Most Viewed Tokens (24h)\n\n"
        if self.tokens:
            for token in self.tokens:
                formatted += f"{token.formatted_response}\n"
        else:
            formatted += "No token view data available\n"
        return formatted


class VotedToken(BaseModel):
    """Model for token voting statistics."""

    mint: Optional[str] = None
    up_count: Optional[int] = 0
    vote_count: Optional[int] = 0

    @property
    def formatted_response(self) -> str:
        """Format voting statistics for display."""
        formatted = f"## Token {self.mint or 'Unknown'}\n"
        formatted += f"- Upvotes: {self.up_count:,}\n"
        formatted += f"- Total Votes: {self.vote_count:,}\n"
        if self.vote_count and self.up_count:
            formatted += f"- Approval Rate: {(self.up_count/self.vote_count)*100:.1f}%\n"
        else:
            formatted += "- Approval Rate: Unknown\n"
        return formatted


class VotedTokensResponse(BaseModel):
    """Model for voted tokens API response."""

    tokens: Optional[List[VotedToken]] = []

    @property
    def formatted_response(self) -> str:
        """Format complete response for display."""
        formatted = "# Most Voted Tokens (24h)\n\n"
        if self.tokens:
            for token in self.tokens:
                formatted += f"{token.formatted_response}\n"
        else:
            formatted += "No token voting data available\n"
        return formatted