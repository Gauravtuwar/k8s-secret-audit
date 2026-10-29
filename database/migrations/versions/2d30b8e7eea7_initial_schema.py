"""initial_schema

Revision ID: 2d30b8e7eea7
Revises: 
Create Date: 2026-10-29 22:27:40.439565

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2d30b8e7eea7'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    # users
    if 'users' not in existing_tables:
        op.create_table(
            'users',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('email', sa.String(length=255), nullable=False),
            sa.Column('hashed_password', sa.String(length=255), nullable=False),
            sa.Column('full_name', sa.String(length=255), nullable=True),
            sa.Column('is_active', sa.Boolean(), nullable=True),
            sa.Column('is_superuser', sa.Boolean(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # clusters
    if 'clusters' not in existing_tables:
        op.create_table(
            'clusters',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('user_id', sa.String(length=36), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('is_demo', sa.Boolean(), nullable=True),
            sa.Column('api_server', sa.String(length=255), nullable=True),
            sa.Column('kubernetes_version', sa.String(length=64), nullable=True),
            sa.Column('node_count', sa.Integer(), nullable=True),
            sa.Column('namespace_count', sa.Integer(), nullable=True),
            sa.Column('connection_status', sa.String(length=64), nullable=True),
            sa.Column('last_audit_at', sa.DateTime(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )

    # cluster_connections
    if 'cluster_connections' not in existing_tables:
        op.create_table(
            'cluster_connections',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('cluster_id', sa.String(length=36), nullable=False),
            sa.Column('auth_type', sa.String(length=32), nullable=False),
            sa.Column('encrypted_credentials', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['cluster_id'], ['clusters.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('cluster_id')
        )

    # audits
    if 'audits' not in existing_tables:
        op.create_table(
            'audits',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('user_id', sa.String(length=36), nullable=False),
            sa.Column('cluster_id', sa.String(length=36), nullable=False),
            sa.Column('started_at', sa.DateTime(), nullable=True),
            sa.Column('completed_at', sa.DateTime(), nullable=True),
            sa.Column('status', sa.String(length=64), nullable=True),
            sa.Column('current_step', sa.String(length=128), nullable=True),
            sa.Column('security_score', sa.Float(), nullable=True),
            sa.Column('critical_count', sa.Integer(), nullable=True),
            sa.Column('high_count', sa.Integer(), nullable=True),
            sa.Column('medium_count', sa.Integer(), nullable=True),
            sa.Column('low_count', sa.Integer(), nullable=True),
            sa.Column('informational_count', sa.Integer(), nullable=True),
            sa.Column('total_secrets_audited', sa.Integer(), nullable=True),
            sa.Column('is_demo', sa.Boolean(), nullable=True),
            sa.Column('summary_json', sa.JSON(), nullable=True),
            sa.ForeignKeyConstraint(['cluster_id'], ['clusters.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )

    # findings
    if 'findings' not in existing_tables:
        op.create_table(
            'findings',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('audit_id', sa.String(length=36), nullable=False),
            sa.Column('cluster_id', sa.String(length=36), nullable=False),
            sa.Column('rule_id', sa.String(length=32), nullable=False),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('description', sa.Text(), nullable=False),
            sa.Column('rationale', sa.Text(), nullable=True),
            sa.Column('severity', sa.String(length=32), nullable=False),
            sa.Column('category', sa.String(length=64), nullable=False),
            sa.Column('namespace', sa.String(length=128), nullable=True),
            sa.Column('resource_type', sa.String(length=128), nullable=False),
            sa.Column('resource_name', sa.String(length=255), nullable=False),
            sa.Column('status', sa.String(length=32), nullable=True),
            sa.Column('evidence', sa.JSON(), nullable=True),
            sa.Column('impact', sa.Text(), nullable=True),
            sa.Column('recommendation', sa.Text(), nullable=False),
            sa.Column('remediation', sa.Text(), nullable=True),
            sa.Column('references', sa.JSON(), nullable=True),
            sa.Column('first_detected', sa.DateTime(), nullable=True),
            sa.Column('last_detected', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['audit_id'], ['audits.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['cluster_id'], ['clusters.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )

    # secrets_inventory
    if 'secrets_inventory' not in existing_tables:
        op.create_table(
            'secrets_inventory',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('audit_id', sa.String(length=36), nullable=False),
            sa.Column('cluster_id', sa.String(length=36), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('namespace', sa.String(length=128), nullable=False),
            sa.Column('type', sa.String(length=128), nullable=False),
            sa.Column('created_at_k8s', sa.DateTime(), nullable=True),
            sa.Column('age_days', sa.Integer(), nullable=True),
            sa.Column('used_by', sa.JSON(), nullable=True),
            sa.Column('rbac_exposure', sa.String(length=32), nullable=True),
            sa.Column('encryption_status', sa.String(length=32), nullable=True),
            sa.Column('risk_level', sa.String(length=32), nullable=True),
            sa.Column('labels', sa.JSON(), nullable=True),
            sa.Column('annotations', sa.JSON(), nullable=True),
            sa.ForeignKeyConstraint(['audit_id'], ['audits.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['cluster_id'], ['clusters.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )

    # rbac_permissions
    if 'rbac_permissions' not in existing_tables:
        op.create_table(
            'rbac_permissions',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('audit_id', sa.String(length=36), nullable=False),
            sa.Column('cluster_id', sa.String(length=36), nullable=False),
            sa.Column('subject_kind', sa.String(length=64), nullable=False),
            sa.Column('subject_name', sa.String(length=255), nullable=False),
            sa.Column('subject_namespace', sa.String(length=128), nullable=True),
            sa.Column('role_kind', sa.String(length=64), nullable=False),
            sa.Column('role_name', sa.String(length=255), nullable=False),
            sa.Column('verbs', sa.JSON(), nullable=False),
            sa.Column('namespace', sa.String(length=128), nullable=True),
            sa.Column('risk_level', sa.String(length=32), nullable=True),
            sa.ForeignKeyConstraint(['audit_id'], ['audits.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['cluster_id'], ['clusters.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )

    # encryption_checks
    if 'encryption_checks' not in existing_tables:
        op.create_table(
            'encryption_checks',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('audit_id', sa.String(length=36), nullable=False),
            sa.Column('cluster_id', sa.String(length=36), nullable=False),
            sa.Column('check_name', sa.String(length=255), nullable=False),
            sa.Column('status', sa.String(length=32), nullable=False),
            sa.Column('provider_chain', sa.JSON(), nullable=True),
            sa.Column('wildcard_configured', sa.Boolean(), nullable=True),
            sa.Column('identity_fallback_detected', sa.Boolean(), nullable=True),
            sa.Column('explanation', sa.Text(), nullable=False),
            sa.Column('recommendation', sa.Text(), nullable=True),
            sa.ForeignKeyConstraint(['audit_id'], ['audits.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['cluster_id'], ['clusters.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )

    # reports
    if 'reports' not in existing_tables:
        op.create_table(
            'reports',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('user_id', sa.String(length=36), nullable=False),
            sa.Column('audit_id', sa.String(length=36), nullable=False),
            sa.Column('cluster_id', sa.String(length=36), nullable=False),
            sa.Column('report_name', sa.String(length=255), nullable=False),
            sa.Column('format', sa.String(length=16), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['audit_id'], ['audits.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['cluster_id'], ['clusters.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )

    # audit_logs
    if 'audit_logs' not in existing_tables:
        op.create_table(
            'audit_logs',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('user_id', sa.String(length=36), nullable=True),
            sa.Column('action', sa.String(length=128), nullable=False),
            sa.Column('target_type', sa.String(length=64), nullable=True),
            sa.Column('target_id', sa.String(length=128), nullable=True),
            sa.Column('details', sa.JSON(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('reports')
    op.drop_table('encryption_checks')
    op.drop_table('rbac_permissions')
    op.drop_table('secrets_inventory')
    op.drop_table('findings')
    op.drop_table('audits')
    op.drop_table('cluster_connections')
    op.drop_table('clusters')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
